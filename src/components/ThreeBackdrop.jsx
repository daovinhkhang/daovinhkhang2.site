import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function ThreeBackdrop() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return undefined;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.IcosahedronGeometry(1.7, 5);
    const wire = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
        transparent: true,
        opacity: 0.2,
      }),
    );
    scene.add(wire);

    const pointsGeometry = new THREE.BufferGeometry();
    const pointCount = 1400;
    const positions = new Float32Array(pointCount * 3);

    for (let i = 0; i < pointCount; i += 1) {
      const radius = 2.1 + Math.random() * 0.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      pointsGeometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.55,
        size: 0.02,
      }),
    );

    scene.add(points);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1.8, 2.2, 2.5);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const clock = new THREE.Clock();
    let animationId;

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      wire.rotation.x = elapsed * 0.12;
      wire.rotation.y = elapsed * 0.24;

      points.rotation.y = -elapsed * 0.08;
      points.rotation.x = elapsed * 0.03;

      camera.position.x = Math.sin(elapsed * 0.15) * 0.3;
      camera.position.y = Math.cos(elapsed * 0.1) * 0.22;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      animationId = window.requestAnimationFrame(animate);
    };

    const handleResize = () => {
      if (!mount) {
        return;
      }

      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      pointsGeometry.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="three-backdrop" ref={mountRef} aria-hidden />;
}

export default ThreeBackdrop;
