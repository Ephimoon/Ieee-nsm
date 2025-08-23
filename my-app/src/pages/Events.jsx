import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import './Events.css';

const EVENTS_JSON_URL = process.env.REACT_APP_EVENTS_JSON_URL;

const Events = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const TTL = 5 * 60 * 1000; // 5 minutes
    let cancelled = false;
    const key = 'events_cache_v1';
    const cached = localStorage.getItem(key);
    if (cached) {
      const { t, data } = JSON.parse(cached);
      if (Date.now() - t < TTL) setRows(data);
    }

    (async () => {
      const res = await fetch(EVENTS_JSON_URL, { cache: 'no-store' });
      const data = await res.json();
      if (!cancelled) {
        const published = data.filter(r => r.published)
          .sort((a,b)=> new Date(a.start_iso)-new Date(b.start_iso));
        setRows(published);
        localStorage.setItem(key, JSON.stringify({ t: Date.now(), data: published }));
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <Layout>
      <div className="events-grid">
        {rows.map(ev => {
          const gallery = [
            ...(ev.images || []).slice(1),
            ...(ev.more_images || []),
          ].filter(Boolean);

          return (
            <article id={ev.slug} key={ev.slug} className="event-card">
              {ev.images?.[0] && (
                <img
                  src={ev.images[0]}
                  alt={ev.title}
                  className="event-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <h2 className="event-title">{ev.title}</h2>
              <p className="event-meta">
                {new Date(ev.start_iso).toLocaleString([], {
                  month:'short',
                  day:'numeric',
                  year:'numeric',
                  hour:'numeric',
                  minute:'2-digit'
                })}
                {ev.location ? ` • ${ev.location}` : ''}
              </p>
              {ev.summary && <p className="event-summary">{ev.summary}</p>}

              {gallery.length > 0 && (
                <div className="event-gallery">
                  {gallery.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      decoding="async"
                    />
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </Layout>
  );
};

export default Events;
