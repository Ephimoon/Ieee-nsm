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

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
}); 

const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Gets user timezone

export const getGoogleCalendarEvents = async () => {
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
  const CALENDAR_ID = process.env.REACT_APP_GOOGLE_CALENDAR_ID;

  const now = new Date();

  const oneMonthAgo = new Date(now);
  oneMonthAgo.setMonth(now.getMonth() - 1);

  const oneYearAhead = new Date(now);
  oneYearAhead.setFullYear(now.getFullYear() + 1);

  const timeMin = oneMonthAgo.toISOString();
  const timeMax = oneYearAhead.toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    CALENDAR_ID
  )}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

  const response = await fetch(url);
  const data = await response.json();

  return data.items.map((event) => {
    const isAllDay = !!event.start.date;

    const rawStart = event.start.dateTime || event.start.date;
    const rawEnd = event.end.dateTime || event.end.date;

    // Parse using local time zone for global accuracy
    let start = utcToZonedTime(parseISO(rawStart), userTimeZone);
    let end = utcToZonedTime(parseISO(rawEnd), userTimeZone);

    return {
      title: event.summary,
      start,
      end,
      allDay: isAllDay,
      description: event.description,
      location: event.location,
    };
  });
};

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

const EventModal = ({ event, onClose }) => {
  if (!event) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>{event.title}</h2>
        <p><strong>{event.start.toLocaleString()}</strong></p>
        <p>{event.description || 'No description available.'}</p>

        <ul>
          <li><strong>Location:</strong> {event.location || 'N/A'}</li>
          <li><strong>All Day:</strong> {event.allDay ? 'Yes' : 'No'}</li>
        </ul>

        <a
          href={`https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent(event.title)}&dates=${formatDateForGoogle(event.start, event.end)}&details=${encodeURIComponent(event.description || '')}&location=${encodeURIComponent(event.location || '')}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Copy to Calendar
        </a>
      </div>
    </div>
  );
};


const CalendarComponent = () => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const events = await getGoogleCalendarEvents();
      setEvents(events);
    };
    fetchEvents();
  }, []);

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  return (
    <div className="calendar-container">
      <Calendar
        defaultView="month"
        views={['month', 'week', 'day', 'agenda']}
        view={view}
        onView={(newView) => setView(newView)}
        date={date}
        onNavigate={(newDate) => setDate(newDate)}
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 800 }}
        className="custom-calendar"
        onSelectEvent={handleEventClick}
        eventPropGetter={(event) => {
          if (event.allDay) {
            return {
              className: 'all-day-event',
              style: {
                backgroundColor: '#3385AD',
              },
            };
          } else {
            return {
              className: 'timed-event',
              style: {
                color: '#004B96',
              },
            };
          }
        }}
      />

      <EventModal event={selectedEvent} onClose={closeModal} />

      <div className="timezone-label">
        Showing events in your local time zone: <strong>{userTimeZone}</strong>
      </div>

      <a
        href={`https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(
          process.env.REACT_APP_GOOGLE_CALENDAR_ID
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="add-calendar-button"
      >
        Add This Calendar to Your Google Calendar
      </a>
    </div>
  );
};

export default CalendarComponent;