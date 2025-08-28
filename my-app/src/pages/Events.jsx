import React, { useEffect, useMemo, useRef, useState } from 'react';
import Layout from '../components/Layout';
import heroImg from '../images/events-hero.jpg';
import './Events.css';

const EVENTS_JSON_URL = process.env.REACT_APP_EVENTS_JSON_URL;

// --- helpers ---
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

const Events = () => {
  const [rows, setRows] = useState([]);
  const [upPage, setUpPage] = useState(0); // page index for upcoming (3 per page)

  // horizontal "Previous Events" scroll state
  const pastTrackRef = useRef(null);
  const [canPastLeft, setCanPastLeft]   = useState(false);
  const [canPastRight, setCanPastRight] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 1) paint immediately from session snapshot if present
    const SNAP_KEY = 'events_snapshot_v1';
    const snap = sessionStorage.getItem(SNAP_KEY);
    if (snap) {
      try {
        const parsed = JSON.parse(snap);
        if (!cancelled) setRows(parsed.filter(r => r.published));
      } catch {}
    }

    // 2) always fetch fresh (warm server cache should be fast)
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

    fetchFresh();                        // initial load
    const id = setInterval(fetchFresh, 20000); // live updates while open

    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const now = Date.now();
  const isUpcoming = (ev) => new Date(ev.end_iso).getTime() >= now;

  const upcoming = useMemo(
    () => rows.filter(isUpcoming)
              .sort((a,b) => new Date(a.start_iso) - new Date(b.start_iso)),
    [rows]
  );

  const past = useMemo(
    () => rows.filter(ev => !isUpcoming(ev))
              .sort((a,b) => new Date(b.start_iso) - new Date(a.start_iso)),
    [rows]
  );

  // Date + Time formatter (smart about same-day vs multi-day and all-day)
const fmtDateTimeRange = (startIso, endIso) => {
  const start = new Date(startIso);
  const end   = new Date(endIso);

  const sameDay = start.toDateString() === end.toDateString();
  const dateFmt = { month: 'short', day: 'numeric', year: 'numeric' };
  const timeFmt = { hour: 'numeric', minute: '2-digit' };

  // Heuristic: if both times are exactly midnight, treat as all-day (don’t show times)
  const hasStartTime = !(start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0);
  const hasEndTime   = !(end.getHours()   === 0 && end.getMinutes()   === 0 && end.getSeconds()   === 0);

  if (sameDay) {
    const datePart = start.toLocaleDateString([], dateFmt);
    if (hasStartTime || hasEndTime) {
      const startT = start.toLocaleTimeString([], timeFmt);
      const endT   = end.toLocaleTimeString([], timeFmt);
      // Example: "Aug 28, 2025 · 2:00–3:30 PM"
      return `${datePart} · ${startT}–${endT}`;
    }
    return datePart;
  }

  // Multi-day
  const startPart = start.toLocaleDateString([], dateFmt) + (hasStartTime ? `, ${start.toLocaleTimeString([], timeFmt)}` : '');
  const endPart   = end.toLocaleDateString([], dateFmt)   + (hasEndTime   ? `, ${end.toLocaleTimeString([], timeFmt)}`   : '');
  // Example: "Aug 28, 2025, 9:00 AM – Aug 29, 2025, 1:00 PM"
  return `${startPart} – ${endPart}`;
};

// Times-only (show date only if multi-day so it's clear where it ends)
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

  // Multi-day: keep start date on the left; here we show when it ends (and time if present)
  const endDate = end.toLocaleDateString([], dateFmt);
  if (!hasStartTime && !hasEndTime) return `Ends ${endDate}`;
  if (hasStartTime && hasEndTime)   return `${start.toLocaleTimeString([], timeFmt)} – ${endDate}, ${end.toLocaleTimeString([], timeFmt)}`;
  if (hasStartTime)                 return `${start.toLocaleTimeString([], timeFmt)} – ${endDate}`;
  return `Ends ${endDate}, ${end.toLocaleTimeString([], timeFmt)}`;
};

  // --- renderers ---
  const renderUpcomingCard = (ev) => {
    const displaySummary = ev.short_summary?.trim() || clamp3(ev.summary || '');
    return (
      <article id={ev.slug} key={ev.slug} className="up-card">
        <div className="up-date">
          <div className="up-date-month">
            {new Date(ev.start_iso).toLocaleString([], { month: 'short' })}
          </div>
          <div className="up-date-day">
            {new Date(ev.start_iso).toLocaleString([], { day: '2-digit' })}
          </div>
          <div className="up-date-year">
            {new Date(ev.start_iso).getFullYear()}
          </div>
        </div>

        <div className="up-body">
          <h3 className="up-title">{ev.title}</h3>
          <p className="up-meta">
            {fmtTimeOnly(ev.start_iso, ev.end_iso)}
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
  };

  const renderPastCard = (ev) => {
    const displaySummary = ev.short_summary?.trim() || clamp3(ev.summary || '');
    const cover = ev.images?.[0];
    return (
      <article id={`past-${ev.slug}`} key={ev.slug} className="past-card">
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
          <div className="past-meta">
            {fmtDateTimeRange(ev.start_iso, ev.end_iso)}
          </div>
          {displaySummary && <p className="past-summary">{displaySummary}</p>}
        </div>
      </article>
    );
  };

  // --- paging for upcoming (3 at a time) ---
  const PAGE_SIZE = 3;
  const totalUpPages = Math.ceil(upcoming.length / PAGE_SIZE) || 1;
  const upSlice = upcoming.slice(upPage * PAGE_SIZE, upPage * PAGE_SIZE + PAGE_SIZE);

  // Show/hide upcoming arrows
  const showUpAnyArrows = upcoming.length > PAGE_SIZE;
  const showUpPrev = showUpAnyArrows && upPage > 0;
  const showUpNext = showUpAnyArrows && upPage < totalUpPages - 1;

  // --- horizontal scroller (previous events) ---
  const updatePastArrowState = () => {
    const node = pastTrackRef.current;
    if (!node) return;
    const maxScroll = node.scrollWidth - node.clientWidth;
    // Allow small +/- 1px leeway
    setCanPastLeft(node.scrollLeft > 1);
    setCanPastRight(node.scrollLeft < maxScroll - 1);
  };

  useEffect(() => {
    const node = pastTrackRef.current;
    if (!node) return;

    // update now, after layout & images
    updatePastArrowState();
    const t = setTimeout(updatePastArrowState, 300);

    // listeners
    const onScroll = () => updatePastArrowState();
    const onResize = () => updatePastArrowState();
    node.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // update when images load (affects width)
    const imgs = Array.from(node.querySelectorAll('img'));
    const onImgLoad = () => updatePastArrowState();
    imgs.forEach(img => { if (!img.complete) img.addEventListener('load', onImgLoad); });

    return () => {
      clearTimeout(t);
      node.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      imgs.forEach(img => img.removeEventListener('load', onImgLoad));
    };
  }, [past.length]);

  const scrollPast = (dir = 1) => {
    const node = pastTrackRef.current;
    if (!node) return;
    const card = node.querySelector('.past-card');
    const step = card ? card.getBoundingClientRect().width + 24 : 320;
    node.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  return (
    <Layout>
      {/* Banner */}
      <div className="events-hero">
        <img src={heroImg} alt="Events banner" className="events-hero-img" />
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <>
          <h1 className="events-heading">Upcoming Events</h1>

          <div className="up-wrapper">
            {/* Left control or spacer */}
            {showUpPrev ? (
              <button
                className="up-nav up-nav--prev"
                onClick={() => setUpPage(p => Math.max(0, p - 1))}
                aria-label="Previous events"
              >▲</button>
            ) : (
              // spacer keeps grid centered when arrow is hidden
              <div aria-hidden style={{ width: 42, height: 42 }} />
            )}

            <div className="up-list">
              {upSlice.map(renderUpcomingCard)}
              {upSlice.length === 0 && <p className="up-empty">No more upcoming events.</p>}
            </div>

            {/* Right control or spacer */}
            {showUpNext ? (
              <button
                className="up-nav up-nav--next"
                onClick={() => setUpPage(p => Math.min(totalUpPages - 1, p + 1))}
                aria-label="More events"
              >▼</button>
            ) : (
              <div aria-hidden style={{ width: 42, height: 42 }} />
            )}
          </div>
        </>
      )}

      {/* Split background strip */}
      <div className="events-split" />

      {/* Previous (Horizontal carousel) */}
      {past.length > 0 && (
        <section className="past-section">
          <h2 className="events-heading events-heading--inverse">Previous Events</h2>

          <div className="past-rail">
            {/* Left arrow if we can scroll left; otherwise spacer */}
            {canPastLeft ? (
              <button
                className="past-arrow"
                onClick={() => scrollPast(-1)}
                aria-label="Scroll left"
              >‹</button>
            ) : (
              <div aria-hidden style={{ width: 44, height: 44 }} />
            )}

            <div className="past-track" ref={pastTrackRef}>
              {past.map(renderPastCard)}
            </div>

            {/* Right arrow if we can scroll right; otherwise spacer */}
            {canPastRight ? (
              <button
                className="past-arrow"
                onClick={() => scrollPast(1)}
                aria-label="Scroll right"
              >›</button>
            ) : (
              <div aria-hidden style={{ width: 44, height: 44 }} />
            )}
          </div>
        </section>
      )}
    </Layout>
  );
};

export default Events;
