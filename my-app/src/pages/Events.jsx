import React, { useEffect, useMemo, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Layout from '../components/Layout';
import heroImg from '../images/events-hero.jpg';
import './Events.css';

const EVENTS_JSON_URL = process.env.REACT_APP_EVENTS_JSON_URL;

/* ================= utils ================= */
const clamp3 = (txt = '') =>
  String(txt).split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 3).join(' ');

const fmtDateRange = (startIso, endIso) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameDay = start.toDateString() === end.toDateString();
  const opts = { month: 'short', day: 'numeric', year: 'numeric' };
  const startStr = start.toLocaleDateString([], opts);
  if (sameDay) return startStr;
  const endStr = end.toLocaleDateString([], opts);
  return `${startStr} – ${endStr}`;
};

const fmtDateTimeRange = (startIso, endIso) => {
  const start = new Date(startIso);
  const end   = new Date(endIso);

  const sameDay = start.toDateString() === end.toDateString();
  const dateFmt = { month: 'short', day: 'numeric', year: 'numeric' };
  const timeFmt = { hour: 'numeric', minute: '2-digit' };

  const hasStartTime = !(start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0);
  const hasEndTime   = !(end.getHours()   === 0 && end.getMinutes()   === 0 && end.getSeconds()   === 0);

  if (sameDay) {
    const datePart = start.toLocaleDateString([], dateFmt);
    if (hasStartTime || hasEndTime) {
      const startT = start.toLocaleTimeString([], timeFmt);
      const endT   = end.toLocaleTimeString([], timeFmt);
      return `${datePart} · ${startT}–${endT}`;
    }
    return datePart;
  }

  const startPart = start.toLocaleDateString([], dateFmt) + (hasStartTime ? `, ${start.toLocaleTimeString([], timeFmt)}` : '');
  const endPart   = end.toLocaleDateString([], dateFmt)   + (hasEndTime   ? `, ${end.toLocaleTimeString([], timeFmt)}`   : '');
  return `${startPart} – ${endPart}`;
};

const fmtTimeOnly = (startIso, endIso) => {
  const start = new Date(startIso);
  const end   = new Date(endIso);

  const sameDay = start.toDateString() === end.toDateString();
  const timeFmt = { hour: 'numeric', minute: '2-digit' };
  const dateFmt = { month: 'short', day: 'numeric', year: 'numeric' };

  const isMidnight = d => d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0;
  const hasStartTime = !isMidnight(start);
  const hasEndTime   = !isMidnight(end);

  if (sameDay) {
    if (!hasStartTime && !hasEndTime) return 'All day';
    if (hasStartTime && hasEndTime)   return `${start.toLocaleTimeString([], timeFmt)}–${end.toLocaleTimeString([], timeFmt)}`;
    if (hasStartTime)                 return `${start.toLocaleTimeString([], timeFmt)}`;
    if (hasEndTime)                   return `Ends ${end.toLocaleTimeString([], timeFmt)}`;
  }

  const endDate = end.toLocaleDateString([], dateFmt);
  if (!hasStartTime && !hasEndTime) return `Ends ${endDate}`;
  if (hasStartTime && hasEndTime)   return `${start.toLocaleTimeString([], timeFmt)} – ${endDate}, ${end.toLocaleTimeString([], timeFmt)}`;
  if (hasStartTime)                 return `${start.toLocaleTimeString([], timeFmt)} – ${endDate}`;
  return `Ends ${endDate}, ${end.toLocaleTimeString([], timeFmt)}`;
};

const useIsMobile = (bp = 700) => {
  const [is, setIs] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(`(max-width: ${bp}px)`);
    const on = () => setIs(m.matches);
    on();
    m.addEventListener?.('change', on);
    return () => m.removeEventListener?.('change', on);
  }, [bp]);
  return is;
};

/* =============== small components =============== */
function EventModal({ ev, onClose, fmtDateRange, fmtTimeOnly }) {
  const gallery = [...(ev.images || []), ...(ev.more_images || [])].filter(Boolean);
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => setIdx(0), [ev]);
  const onBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (gallery.length > 1) {
        if (e.key === 'ArrowRight') setIdx(i => (i + 1) % gallery.length);
        if (e.key === 'ArrowLeft')  setIdx(i => (i - 1 + gallery.length) % gallery.length);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [gallery.length, onClose]);

  const dateLine = fmtDateRange(ev.start_iso, ev.end_iso);
  const timeLine = fmtTimeOnly(ev.start_iso, ev.end_iso);

  return (
    <div className="modal-overlay" onMouseDown={onBackdrop} aria-modal="true" role="dialog">
      <div className="modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <h3 className="modal-title">{ev.title}</h3>

        <div className="meta-list">
          <div className="meta-row">
            <svg className="meta-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>{dateLine}</span>
          </div>
          <div className="meta-row">
            <svg className="meta-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="7" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="12" x2="16" y2="14" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <span>{timeLine}</span>
          </div>
          {ev.location && (
            <div className="meta-row">
              <svg className="meta-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10z" fill="none" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="11" r="2.5" fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>{ev.location}</span>
            </div>
          )}
        </div>

        {ev.summary && <p className="modal-summary">{ev.summary}</p>}

        {gallery.length > 0 && (
          <div className="modal-carousel">
            {gallery.length > 1 && (
              <button className="carousel-btn prev" onClick={() => setIdx(i => (i - 1 + gallery.length) % gallery.length)} aria-label="Previous image">
                <svg viewBox="0 0 24 24" className="chev"><polyline points="15 18 9 12 15 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
            <img
              key={idx}
              src={gallery[idx]}
              alt={`${ev.title} image ${idx + 1} of ${gallery.length}`}
              className="carousel-img"
              loading="lazy"
              referrerPolicy="no-referrer"
              decoding="async"
            />
            {gallery.length > 1 && (
              <button className="carousel-btn next" onClick={() => setIdx(i => (i + 1) % gallery.length)} aria-label="Next image">
                <svg viewBox="0 0 24 24" className="chev"><polyline points="9 6 15 12 9 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
            {gallery.length > 1 && (
              <div className="carousel-dots" role="tablist" aria-label="Image selector">
                {gallery.map((_, i) => (
                  <button
                    key={i}
                    className={`dot ${i === idx ? 'is-active' : ''}`}
                    onClick={() => setIdx(i)}
                    aria-label={`Go to image ${i + 1}`}
                    aria-selected={i === idx}
                    role="tab"
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const UpcomingCard = React.memo(function UpcomingCard({ ev, onOpen, isPast = false }) {
  const displaySummary = ev.short_summary?.trim() || clamp3(ev.summary || '');
  const onKey = (e) => (e.key === 'Enter' || e.key === ' ') && onOpen(ev);
  const metaLine = isPast
    ? fmtDateTimeRange(ev.start_iso, ev.end_iso)
    : fmtTimeOnly(ev.start_iso, ev.end_iso);

  return (
    <article
      id={ev.slug}
      className="up-card is-clickable"
      onClick={() => onOpen(ev)}
      role="button"
      tabIndex={0}
      onKeyDown={onKey}
      aria-label={`Open details for ${ev.title}`}
    >
      <div className="up-date">
        <div className="up-date-month">{new Date(ev.start_iso).toLocaleString([], { month: 'short' })}</div>
        <div className="up-date-day">{new Date(ev.start_iso).toLocaleString([], { day: '2-digit' })}</div>
        <div className="up-date-year">{new Date(ev.start_iso).getFullYear()}</div>
      </div>

      <div className="up-body">
        <h3 className="up-title">{ev.title}</h3>
        <p className="up-meta">
          {metaLine}
          {ev.location ? ` • ${ev.location}` : ''}
        </p>
        {displaySummary && <p className="up-summary">{displaySummary}</p>}
        {ev.more_info_url && (
          <a className="up-link" href={ev.more_info_url} target="_blank" rel="noreferrer">
            Learn More →
          </a>
        )}
      </div>
    </article>
  );
});


const PastCard = React.memo(function PastCard({ ev, onOpen }) {
  const displaySummary = ev.short_summary?.trim() || clamp3(ev.summary || '');
  const cover = ev.images?.[0];
  const onKey = (e) => (e.key === 'Enter' || e.key === ' ') && onOpen(ev);

  return (
    <article
      id={`past-${ev.slug}`}
      className="past-card is-clickable"
      onClick={() => onOpen(ev)}
      role="button"
      tabIndex={0}
      onKeyDown={onKey}
      aria-label={`Open details for ${ev.title}`}
    >
      {cover && (
        <img
          src={cover}
          alt={ev.title}
          className="past-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          decoding="async"
        />
      )}
      <div className="past-content">
        <h4 className="past-title">{ev.title}</h4>
        <div className="past-meta">{fmtDateTimeRange(ev.start_iso, ev.end_iso)}</div>
        {displaySummary && <p className="past-summary">{displaySummary}</p>}
      </div>
    </article>
  );
});

/* ================== page ================== */
const SNAP_KEY = 'events_snapshot_v1';
const PAGE_SIZE = 3; // exactly 3 per "page"

const Events = () => {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const viewportRef = useRef(null);
  const isMobile = useIsMobile(700);

  // fetch + cache
  useEffect(() => {
    let cancelled = false;

    const snap = sessionStorage.getItem(SNAP_KEY);
    if (snap) {
      try {
        const parsed = JSON.parse(snap);
        if (!cancelled) setRows(parsed.filter(r => r.published));
      } catch {}
    }

    const fetchFresh = async () => {
      try {
        const res = await fetch(EVENTS_JSON_URL, { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled) {
          const published = data.filter(r => r.published);
          setRows(published);
          sessionStorage.setItem(SNAP_KEY, JSON.stringify(data));
        }
      } catch (e) {
        console.error('events fetch failed', e);
      }
    };

    fetchFresh();
    const id = setInterval(fetchFresh, 20000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // compute upcoming/past FIRST (before upPages)
  const now = Date.now();
  const isUpcoming = (ev) => new Date(ev.end_iso).getTime() >= now;

  const upcoming = useMemo(
    () => rows
      .filter(isUpcoming)
      .sort((a, b) => new Date(a.start_iso) - new Date(b.start_iso)),
    [rows]
  );

  const past = useMemo(
    () => rows
      .filter(ev => !isUpcoming(ev))
      .sort((a, b) => new Date(b.start_iso) - new Date(a.start_iso)),
    [rows]
  );

  // then chunk into 3-per page
  const upPages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < upcoming.length; i += PAGE_SIZE) {
      pages.push(upcoming.slice(i, i + PAGE_SIZE));
    }
    return pages;
  }, [upcoming]);

  // lock body scroll when modal open
  useEffect(() => {
    if (!selected) return;

    const onKey = (e) => e.key === 'Escape' && setSelected(null);
    document.addEventListener('keydown', onKey);

    // robust page lock
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    // reduce scroll chaining at the root
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      document.documentElement.style.overscrollBehavior = '';
      window.scrollTo(0, scrollY);
    };
  }, [selected]);


  // make viewport exactly height of first page (so only 3 visible)
  useLayoutEffect(() => {
    if (isMobile) return; // don't do pager math on mobile

    const node = viewportRef.current;
    if (!node) return;

    const measure = () => {
      const firstPage = node.querySelector('.up-page');
      if (!firstPage) return;
      const h = firstPage.getBoundingClientRect().height;
      node.style.height = `${h}px`;
    };

    // initial + a couple of follow-ups for late layout/images/fonts
    measure();
    const raf = requestAnimationFrame(measure);
    const t1 = setTimeout(measure, 0);
    const t2 = setTimeout(measure, 150);
    document.fonts?.ready?.then(measure);

    // observe first page + its cards for dynamic size changes
    const ro = new ResizeObserver(measure);
    const firstPage = node.querySelector('.up-page');
    if (firstPage) {
      ro.observe(firstPage);
      firstPage.querySelectorAll('.up-card').forEach(el => ro.observe(el));
    }

    // respond to viewport changes
    window.addEventListener('resize', measure);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [isMobile, upPages.length]);

  const hasPast = past.length > 0;

  const feed = useMemo(() => {
    if (!isMobile) return [];
    return [
      ...upcoming.map(ev => ({ ...ev, _isPast: false })),
      ...past.map(ev => ({ ...ev, _isPast: true })),
    ];
  }, [isMobile, upcoming, past]);

  return (
    <Layout>
      {/* Banner */}
      <div className="events-hero">
        <img src={heroImg} alt="Events banner" className="events-hero-img" />
      </div>

      {isMobile ? (
        <>
          <h1 className="events-heading">IEEE-NSM Events</h1>

          {/* --- Upcoming (mobile) --- */}
          <h2 className="events-heading">Upcoming Events</h2>
          <div className="feed-list" aria-label="Upcoming events">
            {upcoming.length ? (
              upcoming.map(ev => (
                <UpcomingCard
                  key={'u-' + ev.slug}
                  ev={ev}
                  isPast={false}
                  onOpen={setSelected}
                />
              ))
            ) : (
              <div className="up-empty">
                <h3>No upcoming events yet</h3>
                <p>We’re planning the next ones. Check back soon.</p>
              </div>
            )}
          </div>

          {/* --- Previous (mobile) --- */}
          <h2 className="events-heading">Previous Events</h2>
          <div className="feed-list" aria-label="Previous events">
            {past.length ? (
              past.map(ev => (
                <UpcomingCard
                  key={'p-' + ev.slug}
                  ev={ev}
                  isPast={true}
                  onOpen={setSelected}
                />
              ))
            ) : (
              <div className="past-empty">
                <p className="past-empty-text">No previous events yet. We’ll post recaps after our first one.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* keep your existing desktop/tablet block exactly as you have it */
        <>
          <h1 className="events-heading">Upcoming Events</h1>
          <div ref={viewportRef} className="up-viewport" aria-label="Upcoming events (paged)">
            {upPages.length ? (
              upPages.map((page, idx) => (
                <section className="up-page" key={idx}>
                  {page.map(ev => (
                    <UpcomingCard key={ev.slug} ev={ev} onOpen={setSelected} />
                  ))}
                </section>
              ))
            ) : (
              <div className="up-empty">
                <h3>No upcoming events yet</h3>
                <p>We’re planning the next ones. Check back soon.</p>
                {hasPast && <a className="up-empty-link" href="#previous">See previous events ↓</a>}
              </div>
            )}
          </div>

          {hasPast && <div className="events-split" />}

          {hasPast ? (
            <section id="previous" className="past-section">
              <h2 className="events-heading events-heading--inverse">Previous Events</h2>
              <div className="past-rail">
                <div className="past-track">
                  {past.map(ev => (
                    <PastCard key={ev.slug} ev={ev} onOpen={setSelected} />
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <section id="previous" className="past-empty">
              <h2 className="events-heading">Previous Events</h2>
              <p className="past-empty-text">No previous events yet. We’ll post recaps after our first one.</p>
            </section>
          )}
        </>
      )}


      {selected && createPortal(
        <EventModal
          ev={selected}
          onClose={() => setSelected(null)}
          fmtDateRange={fmtDateRange}
          fmtTimeOnly={fmtTimeOnly}
        />,
        document.body
      )}
    </Layout>
  );
};

export default Events;
