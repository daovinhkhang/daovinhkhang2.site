/**
 * The docent bar shown while a guided tour is running.
 *
 * It is deliberately not the chat drawer: the drawer is a modal, and a modal
 * cannot show you the thing it is talking about. This sits at the bottom, low
 * enough to stay out of the way, and advances on its own so the tour feels
 * led rather than clicked through — with pause, back and next always there.
 */

function Icon({ d, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

export default function TourBar({
  stops,
  index,
  paused,
  dwell,
  onNext,
  onPrev,
  onTogglePause,
  onEnd,
}) {
  const stop = stops[index];
  const last = index === stops.length - 1;

  return (
    <section className="tour" aria-label="Guided tour">
      {/* refills on every stop; pausing freezes it, exactly like the timer */}
      <div className="tour-meter" aria-hidden>
        <span key={index} style={{ animationDuration: `${dwell}ms`, animationPlayState: paused ? 'paused' : 'running' }} />
      </div>

      <div className="tour-head">
        <span className="tour-eyebrow">
          Guided tour
          <span className="tour-count">
            {String(index + 1).padStart(2, '0')} / {String(stops.length).padStart(2, '0')}
          </span>
        </span>

        <div className="tour-dots" aria-hidden>
          {stops.map((s, i) => (
            <span key={s.id} className={`tour-dot${i < index ? ' is-done' : ''}${i === index ? ' is-now' : ''}`} />
          ))}
        </div>

        <button type="button" className="tour-icon" onClick={onEnd} aria-label="End tour">
          <Icon d="M6 6l12 12M18 6L6 18" size={16} />
        </button>
      </div>

      <p className="tour-note" key={`${stop.id}-${index}`}>
        {stop.narration}
      </p>

      <div className="tour-foot">
        <button
          type="button"
          className="tour-icon"
          onClick={onPrev}
          disabled={index === 0}
          aria-label="Previous stop"
        >
          <Icon d="M15 18l-6-6 6-6" />
        </button>

        <button type="button" className="tour-pause" onClick={onTogglePause}>
          {paused ? <Icon d="M8 5v14M16 5v14-14" size={14} /> : <Icon d="M9 5v14M15 5v14" size={14} />}
          <span>{paused ? 'Resume' : 'Pause'}</span>
        </button>

        <button type="button" className="tour-next" onClick={onNext} aria-label={last ? 'Finish tour' : 'Next stop'}>
          <span>{last ? 'Finish' : 'Next'}</span>
          <Icon d={last ? 'M5 12h14M13 6l6 6-6 6' : 'M5 12h14M13 6l6 6-6 6'} />
        </button>
      </div>
    </section>
  );
}
