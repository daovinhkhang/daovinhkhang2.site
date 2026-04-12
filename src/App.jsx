import { useMemo } from 'react';
import ThreeBackdrop from './components/ThreeBackdrop';
import WhisperPipeline3D from './components/WhisperPipeline3D';

const profilePoints = [
  'Passionate about unlocking the full potential of AI and leveraging it to deliver innovative solutions that drive meaningful results.',
  'Strong focus on LLM systems, multi-agent runtimes, workflow orchestration, backend architecture, speech systems, and production AI delivery.',
  'Build real-world AI systems, not demo-only solutions.',
  'Own full lifecycle: architecture to deployment to optimization to scaling.',
  'Growth mindset with strong research orientation and continuous system improvement.',
];

const experiences = [
  {
    company: 'bTaskee',
    detail: 'AI / Backend Engineer - Tasker Platform',
    time: 'Oct 2025 - Present',
    bullets: [
      'Owned end-to-end roadmap for Tasker V2 to V4, from architecture design to production scaling.',
      'Built Tasker V3 with NodeRAG, ComposeRAG, Meta-Thinker, graph-based retrieval, and multi-turn reasoning.',
      'Re-architected Tasker V4 into a LangGraph-native runtime with modular nodes for routing, memory, retrieval, execution, and verification.',
      'Designed 3-layer attachment intelligence: MongoDB hydration, planner-ready signals, and memory carry-forward with observability tracing.',
      'Standardized escalation flows, country-level data isolation, and benchmark plus regression testing.',
      'Reduced retrieval latency from around 30s to under 5s (about 6x faster).',
    ],
    achievements: ['6x retrieval speedup', 'Rollback-friendly pipeline', 'Production observability tracing'],
    stack: ['Python', 'FastAPI', 'LangChain', 'LangGraph', 'MongoDB', 'Redis', 'Weaviate', 'Docker', 'MCP', 'Langfuse'],
  },
  {
    company: 'EraX -> Gtel Global Mobile Telecommunications JSC',
    detail: 'AI Engineer',
    time: 'Sep 2024 - Jul 2025',
    bullets: [
      'Built chatbot system using LangChain Agent with Odoo integration.',
      'Designed Universal Workflow Engine for business automation.',
      'Integrated Redis memory and vector database for semantic retrieval.',
      'Developed 6 TensorFlow Lite mobile AI models (noise reduction, emotion detection, NER).',
      'Led Speech-to-Text system for Vietnamese accents: preprocessing, fine-tuning, benchmarking, and Vast.ai training workflows.',
    ],
    achievements: [
      'Deployed production AI chatbot and workflow automation',
      'CER improved to 62.5%, WER improved to 73.5% versus Whisper baseline',
      'Delivered mobile AI models under 100MB and reduced QC time around 40%',
      'Achieved around 60% WER reduction and around 30% faster ASR with CTranslate2 on RTX 3090',
    ],
  },
  {
    company: 'FPT IS',
    detail: 'Intern AI Engineer',
    time: 'Jun 2023 - Sep 2023',
    bullets: [
      'Built chatbot architecture using Flask.',
      'Integrated DialoGPT and spaCy.',
      'Performed user intent analysis and optimized deep learning models.',
    ],
    achievements: ['Hands-on deployment experience for chatbot systems', 'Improved response accuracy and performance'],
  },
  {
    company: 'FPT Greenwich',
    detail: 'Teaching Assistant - AI',
    time: 'Feb 2023 - Nov 2024',
    bullets: [
      'Guided students in ML, DL, and AI workshops.',
      'Supported AI projects using Python, TensorFlow, and Colab.',
      'Prepared learning materials and debugging support.',
    ],
    achievements: ['Supported 50+ students', 'Improved student performance around 30%', 'Built tutorials and resolved optimization issues'],
  },
];

const projects = [
  {
    title: 'Tasker Platform Evolution',
    period: 'V2 -> V4',
    details: ['NodeRAG, ComposeRAG, Meta-Thinker', 'LangGraph runtime', 'Attachment intelligence', 'Retrieval optimization and observability'],
  },
  {
    title: 'Speech-to-Text (Vietnamese Accents)',
    details: ['Whisper, Faster-Whisper, CTranslate2', 'Accent-aware ASR pipeline', 'Fine-tuning and benchmarking', 'Strong real-world performance gains'],
  },
  {
    title: 'Odoo AI Chatbot + Workflow Engine',
    details: ['LangChain Agent', 'Tool-calling system', 'Business process automation', 'Redis plus vector retrieval'],
  },
  {
    title: 'Mobile AI Model Suite',
    details: ['TensorFlow Lite optimization', 'Android and iOS inference', 'Lightweight models under 100MB', 'Production-ready deployment'],
  },
  {
    title: 'Stock Price Prediction Model',
    period: 'May 2024 - Ongoing',
    details: ['Conv1D + BiLSTM + GRU hybrid', 'Indicators: RSI, MACD, Bollinger Bands, VIX', 'KFold CV + Keras Tuner'],
    metrics: ['MAPE Train: 1.181%', 'MAPE Test: 1.248% (BRK-B)'],
  },
  {
    title: 'Sentiment Analysis News Model',
    period: 'Sep 2023 - Ongoing',
    details: ['FinBERT + BERT', 'Yahoo Finance + NewsAPI', 'Sentiment + keyword + impact analysis'],
    metrics: ['Accuracy: 0.86', 'F1: 0.85', 'Precision: 0.84'],
  },
  {
    title: 'Scientific Publication',
    details: [
      'Evaluating Hybrid Deep Learning Models for Stock Price Forecasting',
      'Author: Dao Vinh Khang',
      'Platform: SSRN',
      'Published preprint on Nov 17, 2024',
    ],
  },
];

const skillGroups = [
  {
    title: 'AI Systems & LLM',
    items: [
      'LLMs, Transformers, LangChain, LangGraph, RAG',
      'NodeRAG, ComposeRAG, Meta-Thinker',
      'Multi-agent systems and tool calling',
      'Memory orchestration and runtime architecture',
    ],
  },
  {
    title: 'Backend & Platform',
    items: ['Python, FastAPI, Flask, Express', 'MongoDB, PostgreSQL, Redis, Weaviate', 'Docker, MCP, Langfuse'],
  },
  {
    title: 'ML / Deep Learning',
    items: ['TensorFlow, Keras, Scikit-learn', 'BERT, Whisper, Faster-Whisper', 'Torchaudio, Librosa'],
  },
  {
    title: 'Data & Applied AI',
    items: ['Audio processing and ASR systems', 'Retrieval systems and benchmarking', 'Regression testing and observability'],
  },
  {
    title: 'Additional',
    items: ['TypeScript, JavaScript, React Native', 'Firebase, Redux, Axios', 'Scientific writing', 'English: B1 Vstep'],
  },
];

const summaryPoints = [
  'Design production AI systems, not demo-only products.',
  'Strong in RAG architecture and multi-agent runtime design.',
  'Optimize retrieval, latency, and observability at scale.',
  'Own delivery from architecture to deployment to scaling.',
];

function App() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="app-shell">
      <header className="top-nav">
        <a className="brand" href="#home">
          ENGINEER_CORE
        </a>
        <nav className="desktop-nav">
          <a href="#home">Home</a>
          <a href="#profile">Profile</a>
          <a href="#experience">Experience</a>
          <a href="#whisper-flow">Whisper 3D</a>
          <a href="#projects">Projects</a>
          <a href="#skills">Skills</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="btn-primary" href="#contact">
          Connect
        </a>
      </header>

      <aside className="side-rail" aria-hidden>
        <p>SYSTEM.LOG v2.1.0</p>
      </aside>

      <main>
        <section id="home" className="hero section-base">
          <ThreeBackdrop />
          <div className="hero-content">
            <p className="eyebrow">ARCHITECT_IDENTITY</p>
            <h1>
              DAO VINH
              <br />
              KHANG
            </h1>
            <p className="subtitle">AI / Backend Engineer | System Builder | RAG Architect | Multi-Agent Runtime Engineer</p>
            <div className="hero-meta">
              <span>Tan Binh, Ho Chi Minh City, Vietnam</span>
              <a href="mailto:daovinhkhang0834@gmail.com">daovinhkhang0834@gmail.com</a>
              <a href="tel:+84834684568">+84 834684568</a>
              <a href="https://www.linkedin.com/in/dao-vinh-khang-32748023a/" target="_blank" rel="noreferrer">
                LinkedIn: Dao Vinh Khang
              </a>
            </div>
            <pre className="terminal-card">
<span>INIT</span> _SYSTEM_BOOT...
{`\n`}<span>LOAD</span> TASKER_RUNTIME_V4...
{`\n`}<span>STATUS</span> PRODUCTION_READY
            </pre>
          </div>
        </section>

        <section id="profile" className="section-muted">
          <div className="section-inner">
            <h2>Profile</h2>
            <ul className="slash-list">
              {profilePoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        <section id="experience" className="section-base">
          <div className="section-inner">
            <h2>Professional_Trace</h2>
            <div className="timeline">
              {experiences.map((item) => (
                <article key={item.company} className="timeline-item">
                  <p className="timeline-time">{item.time}</p>
                  <div>
                    <h3>{item.company}</h3>
                    <p className="timeline-role">{item.detail}</p>
                    <ul className="slash-list compact">
                      {item.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                    {!!item.achievements?.length && (
                      <>
                        <p className="subhead">Achievements</p>
                        <ul className="slash-list compact">
                          {item.achievements.map((achievement) => (
                            <li key={achievement}>{achievement}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {!!item.stack?.length && (
                      <>
                        <p className="subhead">Tech Stack</p>
                        <div className="tags">
                          {item.stack.map((tech) => (
                            <span key={tech}>{tech}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="whisper-flow" className="section-lowest">
          <div className="section-inner">
            <h2>EraX_Whisper_Runtime</h2>
            <WhisperPipeline3D />
          </div>
        </section>

        <section id="projects" className="section-muted">
          <div className="section-inner">
            <h2>Engineered_Artifacts</h2>
            <div className="projects-grid wide">
              {projects.map((project) => (
                <article key={project.title} className="project-card">
                  <h3>{project.title}</h3>
                  {!!project.period && <p className="timeline-time">{project.period}</p>}
                  <ul className="slash-list compact">
                    {project.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  {!!project.metrics?.length && (
                    <div className="metrics">
                      {project.metrics.map((metric) => (
                        <span key={metric}>{metric}</span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="skills" className="section-lowest">
          <div className="section-inner">
            <h2>Core_Capabilities</h2>
            <div className="skills-grid five-col">
              {skillGroups.map((group) => (
                <article key={group.title} className="skill-group">
                  <h4>{group.title}</h4>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section-base">
          <div className="section-inner credentials-grid">
            <article className="credential-card">
              <h2>Education</h2>
              <p className="timeline-role">Greenwich University</p>
              <p>BSc (Hons) in Computing, 2020 - 2024</p>
              <p>First Class Honours (Excellent), GPA: 3.7 / 4.0</p>
              <ul className="slash-list compact">
                <li>Certificate of Merit (RVR)</li>
                <li>Best Final Project (Spring 2024)</li>
              </ul>
            </article>
            <article className="credential-card">
              <h2>Summary</h2>
              <ul className="slash-list compact">
                {summaryPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      </main>

      <footer id="contact" className="section-lowest footer">
        <div className="section-inner footer-inner">
          <div>
            <h2>LET&apos;S_BUILD</h2>
            <p>Location: Tan Binh, Ho Chi Minh City, Vietnam</p>
            <p>
              Email: <a href="mailto:daovinhkhang0834@gmail.com">daovinhkhang0834@gmail.com</a>
            </p>
            <p>
              Phone: <a href="tel:+84834684568">+84 834684568</a>
            </p>
            <p>
              LinkedIn:{' '}
              <a href="https://www.linkedin.com/in/dao-vinh-khang-32748023a/" target="_blank" rel="noreferrer">
                Dao Vinh Khang
              </a>
            </p>
          </div>
          <div className="footer-right">
            <p className="brand">DAO VINH KHANG</p>
            <p>Copyright {year} ARCHITECT_OS. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <nav className="mobile-nav">
        <a href="#home">Home</a>
        <a href="#profile">Profile</a>
        <a href="#whisper-flow">Whisper</a>
        <a href="#experience">Exp</a>
        <a href="#projects">Projects</a>
        <a href="#contact">Contact</a>
      </nav>
    </div>
  );
}

export default App;

