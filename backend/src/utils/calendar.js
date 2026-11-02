/**
 * Calendar Utilities: RFC 5545 iCalendar (.ics) and Google Calendar Deep Links
 */

const formatToIcsUtc = (date) => {
  const d = new Date(date);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

const escapeIcsText = (str) => {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
};

/**
 * Generates RFC 5545 compliant iCalendar string with strict CRLF line endings
 */
const generateIcs = (event) => {
  const uid = `event-${event._id || event.slug}@franchisedunia.in`;
  const dtstamp = formatToIcsUtc(new Date());
  const dtstart = formatToIcsUtc(event.startDate);
  const dtend = formatToIcsUtc(event.endDate);
  const summary = escapeIcsText(event.title);
  const description = escapeIcsText(event.description);
  const location = escapeIcsText(`${event.venue}, ${event.city}`);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FranchiseDunia//Events Hub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  // Strictly enforce CRLF (\r\n) line endings per RFC 5545 section 3.1
  return lines.join('\r\n') + '\r\n';
};

/**
 * Generates an instant Google Calendar event template URL
 */
const generateGoogleCalendarUrl = (event) => {
  const base = 'https://calendar.google.com/calendar/render';
  const text = encodeURIComponent(event.title);
  const dates = `${formatToIcsUtc(event.startDate)}/${formatToIcsUtc(event.endDate)}`;
  const details = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(`${event.venue}, ${event.city}`);

  return `${base}?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
};

module.exports = {
  formatToIcsUtc,
  escapeIcsText,
  generateIcs,
  generateGoogleCalendarUrl,
};
