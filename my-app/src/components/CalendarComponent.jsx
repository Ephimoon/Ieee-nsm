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

  const timeMin = new Date().toISOString();
  const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

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
    };
  });
};

const CalendarComponent = () => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      const events = await getGoogleCalendarEvents();
      setEvents(events);
    };
    fetchEvents();
  }, []);

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
        style={{ height: 600 }}
        className="custom-calendar"
      />

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