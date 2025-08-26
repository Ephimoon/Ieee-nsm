import React, { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import { parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarComponent.css';

const EVENTS_JSON_URL = process.env.REACT_APP_EVENTS_JSON_URL;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const CALENDAR_ID = process.env.REACT_APP_GOOGLE_CALENDAR_ID;

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales }); 
const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// ------------ HELPERS -------------------------------------------
function formatDateForGoogle(start, end) {
  const pad = (n) => n.toString().padStart(2, '0');

  const formatDate = (date) => {
    return (
      date.getUTCFullYear().toString() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      'T' +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      'Z'
    );
  };

  return `${formatDate(start)}/${formatDate(end)}`;
}

function formatEventRange(start, end, allDay) {
  if (allDay) {
    return format(start, "EEE, MMM d, yyyy"); // single date looks best for all‑day
  }
  // Same day -> show range, otherwise show both dates
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${format(start, "EEE, MMM d, yyyy")} · ${format(start, "p")} – ${format(end, "p")}`;
  }
  return `${format(start, "EEE, MMM d, yyyy p")} – ${format(end, "EEE, MMM d, yyyy p")}`;
}

const formats = {
  timeGutterFormat: 'h a',
  agendaTimeFormat: 'h:mm a',
  agendaDateFormat: 'EEE, MMM d',
  dayFormat: (date, culture, l) => l.format(date, 'd EEE'),
  dayRangeHeaderFormat: ({ start, end }, culture, l) =>
    `${l.format(start, 'EEE MMM d')} — ${l.format(end, 'EEE MMM d')}`,
};

// ------------ MODAL ----------------------------------------------
const EventModal = ({ event, onClose }) => {
  if (!event) return null;

  const { title, start, end, description, location, allDay } = event;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button" onClick={onClose} aria-label="Close">×</button>

        <div className="modal-header">
          <h2 id="event-title">{title}</h2>
          {allDay && <span className="badge">All‑day</span>}
        </div>

        <div className="modal-row">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 14H5V9h14v9z"/></svg>
          <div>{formatEventRange(start, end, allDay)}</div>
        </div>

        {location && (
          <div className="modal-row">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
              target="_blank" rel="noopener noreferrer"
              className="link"
            >
              {location}
            </a>
          </div>
        )}

        {description && description.trim() && (
          <div className="modal-description">{description}</div>
        )}

        <div className="modal-actions">
          <a
            href={`https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(title)}&dates=${formatDateForGoogle(start, end)}&details=${encodeURIComponent(description || '')}&location=${encodeURIComponent(location || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="add-to-calendar-btn add-to-calendar-btn--compact"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6c0-1.1-.9-2-2-2zm0 14H5V9h14v9z"/></svg>
            <span>Add to Google Calendar</span>
          </a>

          {event.published && (event.detailSlug || event.detailUrl) && (
            <a
              href={event.detailSlug ? `/events#${event.detailSlug}` : event.detailUrl}
              className="btn-secondary"
              target={event.detailSlug ? undefined : '_blank'}
              rel={event.detailSlug ? undefined : 'noopener noreferrer'}
            >
              View details
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const WeekEvent = ({ event }) => (
  <div>
    <div style={{ fontWeight: 700 }}>{event.title}</div>
    {event.location && <div style={{ fontSize: '0.85em' }}>{event.location}</div>}
  </div>
);

const AgendaEvent = ({ event }) => (
  <div>
    <div style={{ fontWeight: 700 }}>{event.title}</div>
    {event.description && <div style={{ fontSize: '0.9em', opacity: .9 }}>{event.description}</div>}
  </div>
);

//-------------- main ------------------------------------------------
export const getGoogleCalendarEvents = async () => {
  const now = new Date();
  const oneYearAgo = new Date(now);  oneYearAgo.setFullYear(now.getFullYear() - 1);
  const oneYearAhead = new Date(now); oneYearAhead.setFullYear(now.getFullYear() + 1);

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}` +
    `/events?key=${API_KEY}&timeMin=${oneYearAgo.toISOString()}&timeMax=${oneYearAhead.toISOString()}` +
    `&singleEvents=true&orderBy=startTime`;

  const response = await fetch(url);
  const data = await response.json();

  return (data.items || []).map((event) => {
    const isAllDay = !!event.start.date;

    const rawStart = event.start.dateTime || event.start.date;   // ISO in UTC/Z or date
    const rawEnd   = event.end.dateTime   || event.end.date;

    // local times for display
    const start = utcToZonedTime(parseISO(rawStart), userTimeZone);
    const end   = utcToZonedTime(parseISO(rawEnd),   userTimeZone);

    // *UTC* start ISO for matching with the sheet
    const startIsoUtc = parseISO(rawStart).toISOString();
    const mergeKey = `${(event.summary || '').trim().toLowerCase()}__${startIsoUtc}`;

    return {
      title: event.summary,
      start,
      end,
      allDay: isAllDay,
      description: event.description,
      location: event.location,

      // internal field used only for merging; not shown in UI
      __mergeKey: mergeKey,
    };
  });
};

const CalendarComponent = () => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState(() => window.innerWidth < 600 ? 'agenda' : 'month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 600);
  const [metaMap, setMetaMap] = useState(null);

  // Load sheet
  useEffect(() => {
    (async () => {
      try {
        if (!EVENTS_JSON_URL) { setMetaMap(new Map()); return; }
        const rows = await (await fetch(EVENTS_JSON_URL)).json();
        const map = new Map();
        rows.forEach(r => {
          const key = `${(r.title || '').trim().toLowerCase()}__${new Date(r.start_iso).toISOString()}`;
          map.set(key, r);
        });
        setMetaMap(map);
      } catch (e) {
        console.error(e);
        setMetaMap(new Map()); // still trigger downstream effect
      }
    })();
  }, []);

  // Merge + set (runs even if metaMap is an empty Map)
  useEffect(() => {
    if (!metaMap || !API_KEY || !CALENDAR_ID) return;
    (async () => {
      const raw = await getGoogleCalendarEvents();
      const merged = raw.map(ev => {
        const meta = metaMap.get(ev.__mergeKey);
        return {
          title: ev.title,
          start: ev.start,
          end: ev.end,
          allDay: ev.allDay,
          description: ev.description,
          location: ev.location,
          published: !!meta?.published,
          detailSlug: meta?.slug || null,
          detailUrl: meta?.event_link || null,
        };
      });
      setEvents(merged);
    })();
  }, [metaMap]);

    const CustomToolbar = (toolbarProps) => {
    return (
      <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button onClick={() => toolbarProps.onNavigate('PREV')}>←</button>
          <button onClick={() => toolbarProps.onNavigate('TODAY')}>Today</button>
          <button onClick={() => toolbarProps.onNavigate('NEXT')}>→</button>
        </span>

        <span className="rbc-toolbar-label">{toolbarProps.label}</span>

        {/* Hide view buttons if isMobile */}
        {!isMobile && (
          <span className="rbc-btn-group">
            {toolbarProps.views.map((view) => (
              <button
                key={view}
                onClick={() => toolbarProps.onView(view)}
                className={view === toolbarProps.view ? 'rbc-active' : ''}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </span>
        )}
      </div>
    );
  };


  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 600;
      setIsMobile(mobile);

      if (mobile && view !== 'agenda') {
        setView('agenda');
      } else if (!mobile && view !== 'month') {
        setView('month');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [view]);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="calendar-outer-wrapper">
      <div className="calendar-container">
        <h1>Don't Miss Out on Our Upcoming Events</h1>
        <Calendar
          className={`custom-calendar view-${view}`}
          components={{
            toolbar: CustomToolbar,
            week:   { event: WeekEvent },
            agenda: { event: AgendaEvent }
          }}
          formats={formats}
          step={30}
          timeslots={2}
          min={new Date(0, 0, 0, 7, 0)} // 7AM
          max={new Date(0, 0, 0, 22, 0)} // 10PM
          views={isMobile ? ['agenda'] : ['month', 'week', 'agenda']}
          view={view}
          onView={(newView) => setView(newView)}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ minHeight: '600px', height: 'auto' }}
          onSelectEvent={handleEventClick}
          eventPropGetter={(event) => {
            if (view === 'month') {
              return event.allDay
                ? { className: 'all-day-event', style: { backgroundColor: '#3385AD' } }
                : { className: 'timed-event',   style: { color: '#004B96' } };
            }
            return {};
          }}
        />

        <EventModal event={selectedEvent} onClose={closeModal} />

        <div className="calendar-footer">
          <div className="timezone-label">
            <svg className="tz-clock" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm0 2a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm.5 4h-1v6l5 3 .5-.87-4.5-2.63V7z"/>
            </svg>
            <span>
              timezone — <strong>{userTimeZone}</strong>
            </span>
          </div>

          <a
            href={`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(
              process.env.REACT_APP_GOOGLE_CALENDAR_ID
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="add-to-calendar-btn"
            aria-label="Add to Google Calendar"
          >
            {/* Google Calendar SVG icon (no file needed) */}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6c0-1.1-.9-2-2-2zm0 14H5V9h14v9z"/>
            </svg>
            <span>Add to Google Calendar</span>
          </a>
        </div>

      </div>
    </div>
  );
};

export default CalendarComponent;