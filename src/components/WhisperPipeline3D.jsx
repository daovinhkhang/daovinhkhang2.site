import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const STAGES = [
  {
    label: '01 DATASET LOAD',
    detail: 'Load JSONL train/eval/test and filter by min/max duration.',
    snippet: `train_dataset = JsonlDataset(
  data_list_path=args.train_data,
  min_duration=args.min_audio_len,
  max_duration=args.max_audio_len
)

eval_dataset = JsonlDataset(...)
test_dataset = JsonlDataset(...)`,
  },
  {
    label: '02 AUDIO PIPELINE',
    detail: 'Read waveform, convert mono, resample to 16kHz before feature extraction.',
    snippet: `waveform, sample_rate = torchaudio.load(audio_path)
if waveform.shape[0] > 1:
  waveform = waveform.mean(dim=0, keepdim=True)
if sample_rate != 16000:
  waveform = Resample(sample_rate, 16000)(waveform)
waveform = waveform.squeeze()`,
  },
  {
    label: '03 REALTIME AUGMENT',
    detail: 'Noise, volume, and speed augmentation applied probabilistically in collator.',
    snippet: `if random.random() < self.augmentation_probability:
  audio = augment_audio(
    audio,
    sample_rate,
    noise_db_range=args.noise_db_range,
    volume_db_range=args.volume_db_range,
    speed_range=args.speed_range
  )`,
  },
  {
    label: '04 TRAIN LOOP',
    detail: 'Whisper + AdamW + cosine scheduler + Seq2SeqTrainingArguments on multi-GPU torchrun.',
    snippet: `model = WhisperForConditionalGeneration.from_pretrained(...)
optimizer = AdamW(model.parameters(), lr=5e-5, weight_decay=0.05)
lr_scheduler = get_scheduler('cosine', optimizer=optimizer,
  num_warmup_steps=warmup_steps,
  num_training_steps=max_steps)

trainer = CustomSeq2SeqTrainer(...)
trainer.train(resume_from_checkpoint=args.resume_from_checkpoint)`,
  },
  {
    label: '05 EVAL + EXPORT',
    detail: 'Compute WER/BLEU, track TensorBoard, save final checkpoint.',
    snippet: `def compute_metrics(pred):
  bleu = bleu_eval.compute(...)["bleu"]
  wer = jiwer.wer(label_str, pred_str)
  return {"wer": wer, "bleu": bleu}

final_ckpt_dir = os.path.join(args.output_dir, "checkpoint-final")
model.save_pretrained(final_ckpt_dir)
processor.save_pretrained(final_ckpt_dir)`,
  },
];

const TRAINING_SETUP = [
  'Base model: Whisper Medium',
  'Dataset: 245,000 samples, around 870 hours',
  'Online augmentation: noise, speed, pitch',
  'Vietnamese multi-region speech data',
];

const EVAL_HIGHLIGHTS = [
  'Eval set: 2,000 Vietnamese samples across regions',
  'More than 60% WER error reduction versus base models',
  'Around 30% faster STT with CTranslate2 on RTX 3090',
  'Common Voice eval (2,000 Vietnamese + 2,000 mixed multilingual): TBC',
];

const BENCHMARK_ROWS = [
  {
    model: 'Whisper-medium',
    cer: '0.163',
    cerDelta: '62.5% down vs Whisper-medium',
    wer: '0.284',
    werDelta: '64.3% down vs Whisper-medium',
  },
  {
    model: 'Whisper-large-v3-turbo',
    cer: '0.129',
    cerDelta: '48.8% down vs Whisper-Turbo',
    wer: '0.223',
    werDelta: '72.7% down vs Whisper-Turbo',
  },
  {
    model: 'Whisper-large-v3',
    cer: '0.131',
    cerDelta: '49.6% down vs Whisper-large-v3',
    wer: '0.227',
    werDelta: '73.5% down vs Whisper-large-v3',
  },
  {
    model: 'EraX-WoW-medium-V1.0',
    cer: '0.066',
    cerDelta: '-',
    wer: '0.107',
    werDelta: '-',
    highlight: true,
  },
];

const STAGE_Z = [-8, -4, 0, 4, 8];

function WhisperPipeline3D() {
  const mountRef = useRef(null);
  const hoveredIndexRef = useRef(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x131313, 10, 28);

    const camera = new THREE.PerspectiveCamera(58, mount.clientWidth / mount.clientHeight, 0.1, 120);
    camera.position.set(0, 0.7, 12.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const barGeometry = new THREE.BoxGeometry(0.16, 1, 0.16);
    const barMaterial = new THREE.MeshStandardMaterial({
      color: 0xe6e6e6,
      roughness: 0.35,
      metalness: 0.15,
      emissive: 0x101010,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.8,
    });

    const rings = [];
    const bars = [];
    const ringCount = 44;
    const barsPerRing = 24;
    const tunnelRadius = 3.3;

    for (let r = 0; r < ringCount; r += 1) {
      const z = -10 + r * 0.5;
      const ringGroup = new THREE.Group();
      ringGroup.position.z = z;
      root.add(ringGroup);

      rings.push({ group: ringGroup, baseZ: z });

      for (let i = 0; i < barsPerRing; i += 1) {
        const angle = (i / barsPerRing) * Math.PI * 2;
        const x = Math.cos(angle) * tunnelRadius;
        const y = Math.sin(angle) * tunnelRadius;

        const bar = new THREE.Mesh(barGeometry, barMaterial);
        bar.position.set(x, y, 0);
        bar.lookAt(0, 0, 0);
        bar.rotateX(Math.PI / 2);

        ringGroup.add(bar);
        bars.push({ mesh: bar, ringIndex: r, angle });
      }
    }

    const gateGeometry = new THREE.TorusGeometry(tunnelRadius + 0.45, 0.08, 20, 96);
    const coreGeometry = new THREE.SphereGeometry(0.2, 20, 20);

    const stages = STAGE_Z.map((z, index) => {
      const gateMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x202020,
        emissiveIntensity: 0.4,
        roughness: 0.22,
        metalness: 0.38,
        transparent: true,
        opacity: 0.8,
      });
      const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.8,
      });

      const gate = new THREE.Mesh(gateGeometry, gateMaterial);
      gate.position.z = z;
      gate.rotation.x = Math.PI / 2;
      gate.userData.stageIndex = index;

      const core = new THREE.Mesh(coreGeometry, coreMaterial);
      core.position.z = z;
      core.userData.stageIndex = index;

      root.add(gate, core);

      return {
        gate,
        core,
        gateMaterial,
        coreMaterial,
      };
    });

    const pulseGeometry = new THREE.SphereGeometry(0.1, 14, 14);
    const pulseMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pulses = Array.from({ length: 3 }).map((_, idx) => {
      const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
      pulse.userData.offset = idx * 0.33;
      root.add(pulse);
      return pulse;
    });

    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 320;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const t = (Math.random() - 0.5) * 22;
      const a = Math.random() * Math.PI * 2;
      const radius = 3.9 + Math.random() * 1.5;
      particlePositions[i * 3] = Math.cos(a) * radius;
      particlePositions[i * 3 + 1] = Math.sin(a) * radius;
      particlePositions[i * 3 + 2] = t;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.018,
      transparent: true,
      opacity: 0.22,
    });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    root.add(particles);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.42);
    const keyLight = new THREE.PointLight(0xffffff, 1.2, 48, 2);
    keyLight.position.set(0, 6, 10);
    const fillLight = new THREE.PointLight(0xffffff, 0.65, 40, 2);
    fillLight.position.set(-7, 1, -6);
    scene.add(ambientLight, keyLight, fillLight);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const clickable = stages.map((s) => s.gate);

    const getStageFromEvent = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(clickable, false);
      return intersects.length ? intersects[0].object.userData.stageIndex : null;
    };

    const handlePointerMove = (event) => {
      const stageIndex = getStageFromEvent(event);
      hoveredIndexRef.current = stageIndex;
      renderer.domElement.style.cursor = stageIndex !== null ? 'pointer' : 'default';
      if (stageIndex !== null && stageIndex !== activeIndexRef.current) {
        setActiveIndex(stageIndex);
      }
    };

    const handlePointerLeave = () => {
      hoveredIndexRef.current = null;
      renderer.domElement.style.cursor = 'default';
    };

    const handleClick = (event) => {
      const stageIndex = getStageFromEvent(event);
      if (stageIndex !== null) {
        setActiveIndex(stageIndex);
      }
    };

    renderer.domElement.addEventListener('pointermove', handlePointerMove);
    renderer.domElement.addEventListener('pointerleave', handlePointerLeave);
    renderer.domElement.addEventListener('click', handleClick);

    const clock = new THREE.Clock();
    let rafId;

    const animate = () => {
      const t = clock.getElapsedTime();
      const active = activeIndexRef.current;
      const hovered = hoveredIndexRef.current;

      root.rotation.z = Math.sin(t * 0.11) * 0.04;

      rings.forEach((ring, rIdx) => {
        ring.group.rotation.z = t * 0.035 + rIdx * 0.06;
      });

      bars.forEach((bar) => {
        const wave = Math.sin(t * 2.1 + bar.ringIndex * 0.28 + bar.angle * 2.4);
        const spectral = Math.max(0.14, wave * 0.5 + 0.6);
        const stageBoost = 1 + Math.max(0, 1 - Math.abs(bar.ringIndex - (active * 8 + 6)) * 0.08) * 0.55;
        bar.mesh.scale.y = spectral * stageBoost;
      });

      stages.forEach((stage, idx) => {
        const isActive = idx === active || idx === hovered;
        const pulse = 1 + Math.sin(t * 2 + idx) * 0.04;
        const targetScale = isActive ? 1.24 : 1;

        stage.gate.scale.setScalar(pulse * targetScale);
        stage.core.scale.setScalar(isActive ? 1.7 : 1.1);

        stage.gateMaterial.emissiveIntensity += ((isActive ? 1.15 : 0.38) - stage.gateMaterial.emissiveIntensity) * 0.12;
        stage.gateMaterial.opacity += ((isActive ? 0.98 : 0.72) - stage.gateMaterial.opacity) * 0.12;
        stage.coreMaterial.opacity += ((isActive ? 1 : 0.74) - stage.coreMaterial.opacity) * 0.16;
      });

      pulses.forEach((p, idx) => {
        const progress = (t * (0.24 + idx * 0.08) + p.userData.offset) % 1;
        p.position.z = -10 + progress * 20;
        p.position.x = Math.cos(t * 1.2 + idx) * 0.45;
        p.position.y = Math.sin(t * 1.1 + idx * 1.3) * 0.45;
      });

      particles.rotation.z = -t * 0.02;

      camera.position.x = Math.sin(t * 0.14) * 0.7;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
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
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', handlePointerMove);
      renderer.domElement.removeEventListener('pointerleave', handlePointerLeave);
      renderer.domElement.removeEventListener('click', handleClick);

      barGeometry.dispose();
      barMaterial.dispose();
      gateGeometry.dispose();
      coreGeometry.dispose();
      stages.forEach((stage) => {
        stage.gateMaterial.dispose();
        stage.coreMaterial.dispose();
      });
      pulseGeometry.dispose();
      pulseMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  const activeStage = STAGES[activeIndex];

  const stageChips = useMemo(
    () =>
      STAGES.map((stage, index) => (
        <button
          type="button"
          key={stage.label}
          className={`stage-chip ${index === activeIndex ? 'active' : ''}`}
          onMouseEnter={() => setActiveIndex(index)}
          onFocus={() => setActiveIndex(index)}
          onClick={() => setActiveIndex(index)}
        >
          {stage.label}
        </button>
      )),
    [activeIndex],
  );

  return (
    <section className="whisper-3d-panel" aria-label="Whisper Finetune 3D Interactive Flow">
      <div className="whisper-3d-head">
        <h3>3D Spectrogram Tunnel (EraX Whisper)</h3>
        <p>Audio-energy tunnel visualization mapped to your finetune stages. Hover each gate to inspect code snippets.</p>
      </div>

      <div className="whisper-3d-layout">
        <div className="whisper-3d-canvas-wrap">
          <div className="whisper-3d-canvas" ref={mountRef} />
          <p className="whisper-hint">Hover tunnel gates to switch snippets. On mobile, tap stage chips.</p>
          <div className="stage-chip-grid">{stageChips}</div>
        </div>

        <article className="whisper-code-card">
          <p className="code-label">ACTIVE STAGE</p>
          <h4>{activeStage.label}</h4>
          <p className="code-detail">{activeStage.detail}</p>
          <pre>
            <code>{activeStage.snippet}</code>
          </pre>
        </article>
      </div>

      <div className="pipeline-terminal">
        <p>RUN COMMAND</p>
        <code>CUDA_VISIBLE_DEVICES=0,1 torchrun --nnodes 1 --nproc_per_node 2 Whisper_Turbo_finetune_FULL.py</code>
        <p>TRACKING</p>
        <code>tensorboard --logdir=models/whisper-medium-finetune/runs --host=0.0.0.0 --port=6006</code>
      </div>

      <section className="whisper-metrics" aria-label="EraX Whisper Metrics">
        <div className="whisper-metrics-grid">
          <article className="metric-card">
            <p className="code-label">TRAINING SETUP</p>
            <ul>
              {TRAINING_SETUP.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="metric-card">
            <p className="code-label">EVALUATION HIGHLIGHTS</p>
            <ul>
              {EVAL_HIGHLIGHTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className="benchmark-table-wrap">
          <p className="code-label">BENCHMARK TABLE (LOWER IS BETTER)</p>
          <table className="benchmark-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>CER</th>
                <th>EraX CER Delta</th>
                <th>WER</th>
                <th>EraX WER Delta</th>
              </tr>
            </thead>
            <tbody>
              {BENCHMARK_ROWS.map((row) => (
                <tr key={row.model} className={row.highlight ? 'highlight-row' : ''}>
                  <td>{row.model}</td>
                  <td>{row.cer}</td>
                  <td>{row.cerDelta}</td>
                  <td>{row.wer}</td>
                  <td>{row.werDelta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

export default WhisperPipeline3D;
