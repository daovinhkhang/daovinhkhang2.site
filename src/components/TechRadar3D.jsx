import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RADAR_GROUP_COLORS, TECH_RADAR_LINKS, TECH_RADAR_NODES } from './techRadarData';

const TIER_RADIUS = {
  core: 2.2,
  advanced: 3.45,
  applied: 4.8,
};

const GROUP_PHASE = {
  'AI/LLM': 0.25,
  Backend: 1.6,
  'ML/ASR': 2.7,
  'Data/Quality': 3.9,
  Platform: 5.05,
};

const DEFAULT_HINT = {
  label: 'Hover a node',
  group: 'Tech Radar 3D',
  usedIn: ['Tasker V4 runtime', 'EraX Whisper stack', 'Production AI delivery'],
  outcome: 'Inspect nodes to see where each skill is applied and what impact it created.',
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth <= 819;
}

function buildNodeLayout() {
  const nodesByGroup = new Map();
  TECH_RADAR_NODES.forEach((node) => {
    if (!nodesByGroup.has(node.group)) {
      nodesByGroup.set(node.group, []);
    }
    nodesByGroup.get(node.group).push(node);
  });

  return TECH_RADAR_NODES.map((node, index) => {
    const groupNodes = nodesByGroup.get(node.group) || [];
    const groupIndex = groupNodes.findIndex((candidate) => candidate.id === node.id);
    const radius = TIER_RADIUS[node.tier] || 3.2;
    const phase = GROUP_PHASE[node.group] || 0;
    const spread = (groupIndex / Math.max(1, groupNodes.length)) * Math.PI * 1.08;
    const angle = phase + spread;
    const depthBand = node.tier === 'core' ? 0.6 : node.tier === 'advanced' ? 1.4 : 2.2;

    return {
      ...node,
      orbitRadius: radius + (index % 3) * 0.06,
      orbitSpeed: 0.05 + (index % 7) * 0.008,
      angle,
      bob: 0.22 + (index % 5) * 0.06,
      zOffset: (index % 2 ? 1 : -1) * depthBand,
    };
  });
}

function getNodeHint(layoutNodes, activeNodeId) {
  const active = layoutNodes.find((node) => node.id === activeNodeId);
  if (!active) {
    return DEFAULT_HINT;
  }

  return {
    label: active.label,
    group: `${active.group} • ${active.tier.toUpperCase()}`,
    usedIn: active.usedIn,
    outcome: active.outcome,
  };
}

function TechRadar3D({ onNodeHover = () => {}, onNodeSelect = () => {} }) {
  const mountRef = useRef(null);
  const hoverIdRef = useRef(null);
  const selectedIdRef = useRef(null);
  const nodeMeshesRef = useRef([]);
  const linkMeshesRef = useRef([]);
  const layoutNodesRef = useRef([]);
  const latestDeviceRef = useRef(isMobileViewport());

  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    hoverIdRef.current = hoveredId;
    onNodeHover(hoveredId);
  }, [hoveredId, onNodeHover]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    onNodeSelect(selectedId);
  }, [selectedId, onNodeSelect]);

  const layoutNodes = useMemo(() => buildNodeLayout(), []);
  const activeNodeId = selectedId || hoveredId;
  const hint = useMemo(() => getNodeHint(layoutNodes, activeNodeId), [layoutNodes, activeNodeId]);

  useEffect(() => {
    layoutNodesRef.current = layoutNodes;
  }, [layoutNodes]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return undefined;
    }

    let mobileMode = isMobileViewport();
    latestDeviceRef.current = mobileMode;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x090909, 11, 35);

    const camera = new THREE.PerspectiveCamera(57, mount.clientWidth / mount.clientHeight, 0.1, 120);
    camera.position.set(0, 0.4, 11.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobileMode ? 1.35 : 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const ringGroup = new THREE.Group();
    root.add(ringGroup);

    [2.1, 3.4, 4.7].forEach((radius, idx) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.018, 8, 120),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.12 - idx * 0.02,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ringGroup.add(ring);
    });

    const nodeGeometry = new THREE.IcosahedronGeometry(0.16, 2);
    const nodeMeshes = layoutNodes.map((node) => {
      const material = new THREE.MeshStandardMaterial({
        color: RADAR_GROUP_COLORS[node.group] || 0xffffff,
        emissive: 0x121212,
        emissiveIntensity: 0.35,
        roughness: 0.24,
        metalness: 0.2,
      });
      const mesh = new THREE.Mesh(nodeGeometry, material);
      mesh.scale.setScalar(node.size);
      mesh.userData.nodeId = node.id;
      mesh.userData.anchorId = node.anchorId;
      root.add(mesh);
      return { node, mesh, material };
    });
    nodeMeshesRef.current = nodeMeshes;

    const nodeIndexMap = new Map(nodeMeshes.map((item, idx) => [item.node.id, idx]));
    const validLinks = TECH_RADAR_LINKS.filter((link) => nodeIndexMap.has(link.source) && nodeIndexMap.has(link.target));

    const linkMeshes = validLinks.map((link) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: link.kind === 'impact' ? 0.25 : 0.18,
      });
      const line = new THREE.Line(geometry, material);
      root.add(line);
      return { link, geometry, material, line };
    });
    linkMeshesRef.current = linkMeshes;

    const particleCount = mobileMode ? 80 : 220;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const r = 5 + Math.random() * 2.6;
      const a = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * 7;
      particlePositions[i * 3] = Math.cos(a) * r;
      particlePositions[i * 3 + 1] = Math.sin(a) * r;
      particlePositions[i * 3 + 2] = z;
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: mobileMode ? 0.011 : 0.016,
      transparent: true,
      opacity: mobileMode ? 0.12 : 0.2,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    root.add(particles);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.36);
    const keyLight = new THREE.PointLight(0xffffff, 1.1, 60, 2);
    keyLight.position.set(2.2, 4, 8.5);
    const backLight = new THREE.PointLight(0xffffff, 0.6, 54, 2);
    backLight.position.set(-4.2, -2.5, -7.4);
    scene.add(ambientLight, keyLight, backLight);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const setPointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const pickNode = (event) => {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(nodeMeshes.map((entry) => entry.mesh), false);
      if (!intersections.length) {
        return null;
      }
      const targetMesh = intersections[0].object;
      const nodeId = targetMesh.userData.nodeId;
      return nodeId || null;
    };

    const handlePointerMove = (event) => {
      const nodeId = pickNode(event);
      hoverIdRef.current = nodeId;
      setHoveredId(nodeId);
      renderer.domElement.style.cursor = nodeId ? 'pointer' : 'default';
    };

    const handlePointerLeave = () => {
      hoverIdRef.current = null;
      setHoveredId(null);
      renderer.domElement.style.cursor = 'default';
    };

    const handleClick = (event) => {
      const nodeId = pickNode(event);
      if (!nodeId) {
        setSelectedId(null);
        return;
      }

      setSelectedId(nodeId);
      const selectedNode = layoutNodesRef.current.find((entry) => entry.id === nodeId);
      const anchorId = selectedNode?.anchorId || null;
      if (!anchorId) {
        return;
      }

      const target = document.getElementById(anchorId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);
    renderer.domElement.addEventListener('click', handleClick);

    const clock = new THREE.Clock();
    let frameCounter = 0;
    let rafId = 0;

    const animate = () => {
      const t = clock.getElapsedTime();
      const hoverNode = hoverIdRef.current;
      const selectedNode = selectedIdRef.current;
      const activeNode = selectedNode || hoverNode;

      ringGroup.rotation.z = t * 0.018;
      root.rotation.z = Math.sin(t * 0.12) * 0.08;

      nodeMeshes.forEach((entry, idx) => {
        const { node, mesh, material } = entry;
        const angle = node.angle + t * node.orbitSpeed;
        const radiusPulse = node.orbitRadius + Math.sin(t * 0.45 + idx) * 0.06;
        const x = Math.cos(angle) * radiusPulse;
        const y = Math.sin(angle) * (radiusPulse * 0.7);
        const z = node.zOffset + Math.sin(t * 0.8 + idx * 0.73) * node.bob;
        mesh.position.set(x, y, z);

        const active = node.id === activeNode;
        const linked = activeNode
          ? validLinks.some(
              (link) =>
                (link.source === activeNode && link.target === node.id) || (link.target === activeNode && link.source === node.id),
            )
          : false;

        const targetScale = active ? node.size * 1.24 : linked ? node.size * 1.08 : node.size;
        mesh.scale.x += (targetScale - mesh.scale.x) * 0.17;
        mesh.scale.y += (targetScale - mesh.scale.y) * 0.17;
        mesh.scale.z += (targetScale - mesh.scale.z) * 0.17;

        const targetEmissive = active ? 0.92 : linked ? 0.58 : 0.34;
        material.emissiveIntensity += (targetEmissive - material.emissiveIntensity) * 0.15;
      });

      const skipLinkUpdate = mobileMode && frameCounter % 2 === 1;
      if (!skipLinkUpdate) {
        linkMeshes.forEach((entry) => {
          const src = nodeMeshes[nodeIndexMap.get(entry.link.source)];
          const dst = nodeMeshes[nodeIndexMap.get(entry.link.target)];
          if (!src || !dst) {
            return;
          }

          const positions = entry.geometry.attributes.position.array;
          positions[0] = src.mesh.position.x;
          positions[1] = src.mesh.position.y;
          positions[2] = src.mesh.position.z;
          positions[3] = dst.mesh.position.x;
          positions[4] = dst.mesh.position.y;
          positions[5] = dst.mesh.position.z;
          entry.geometry.attributes.position.needsUpdate = true;

          const highlighted =
            activeNode && (entry.link.source === activeNode || entry.link.target === activeNode);
          const opacity = highlighted ? 0.52 : entry.link.kind === 'impact' ? 0.24 : 0.16;
          if (mobileMode) {
            entry.material.opacity = opacity * 0.78;
          } else {
            entry.material.opacity += (opacity - entry.material.opacity) * 0.16;
          }
        });
      }

      particles.rotation.z = -t * 0.015;
      camera.position.x = Math.sin(t * 0.2) * 0.45;
      camera.position.y = Math.cos(t * 0.13) * 0.22;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      frameCounter += 1;
      rafId = window.requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (!mountRef.current) {
        return;
      }

      const newMobileMode = isMobileViewport();
      if (newMobileMode !== latestDeviceRef.current) {
        latestDeviceRef.current = newMobileMode;
        mobileMode = newMobileMode;
      }

      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobileMode ? 1.35 : 2));
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('click', handleClick);

      ringGroup.children.forEach((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });

      nodeGeometry.dispose();
      nodeMeshes.forEach((entry) => {
        entry.material.dispose();
      });

      linkMeshes.forEach((entry) => {
        entry.geometry.dispose();
        entry.material.dispose();
      });

      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [layoutNodes]);

  return (
    <section className="radar-3d-panel" aria-label="Tech Radar 3D">
      <div className="radar-3d-head">
        <h3>Tech Radar 3D</h3>
        <p>Orbital network of production skills. Hover to inspect usage and impact, click to jump to proof in portfolio.</p>
      </div>

      <div id="tech-radar-canvas" className="radar-3d-layout">
        <div className="radar-canvas-wrap">
          <div className="radar-canvas" ref={mountRef} />
          <p className="radar-hint">Hover node to preview evidence. Click to lock node and auto-scroll to related anchor.</p>
        </div>

        <article className="radar-detail-card">
          <p className="code-label">ACTIVE NODE</p>
          <h4>{hint.label}</h4>
          <p className="radar-group-tag">{hint.group}</p>
          <p className="code-detail">{hint.outcome}</p>
          <p className="code-label">USED IN</p>
          <ul>
            {hint.usedIn.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

export default TechRadar3D;
