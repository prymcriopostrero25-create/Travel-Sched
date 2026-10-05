/**
 * Personnel Travel calendar JSON endpoint.
 *
 * Before deployment, open Project Settings > Script properties and add:
 *   ACCESS_CODE: a long random value you also put in the React .env.local file
 *   CALENDAR_ID: primary, or a shared calendar's Calendar ID (optional)
 * Also add the Google Calendar API and Gmail API under Services in the Apps Script editor.
 */
const EVENT_COLORS_BY_ID = {
  '1': CalendarApp.EventColor.PALE_BLUE,
  '2': CalendarApp.EventColor.PALE_GREEN,
  '3': CalendarApp.EventColor.MAUVE,
  '4': CalendarApp.EventColor.PALE_RED,
  '5': CalendarApp.EventColor.YELLOW,
  '6': CalendarApp.EventColor.ORANGE,
  '7': CalendarApp.EventColor.CYAN,
  '8': CalendarApp.EventColor.GRAY,
  '9': CalendarApp.EventColor.BLUE,
  '10': CalendarApp.EventColor.GREEN,
  '11': CalendarApp.EventColor.RED
};

/**
 * Run this once from the Apps Script editor to authorize Gmail sending.
 * After permission is granted, a confirmation email is sent to the account
 * executing the script.
 */
function authorizeGmailSending() {
  const recipient = Session.getEffectiveUser().getEmail();
  if (!recipient) {
    throw new Error('Apps Script could not determine the executing account email address.');
  }
  sendGmailItinerary(
    recipient,
    'Personnel Travel System: Gmail authorization successful',
    'Gmail sending is now authorized for the Personnel Travel System.',
    '<p>Gmail sending is now authorized for the <strong>Personnel Travel System</strong>.</p>'
  );
  return 'Authorization successful. Confirmation email sent to ' + recipient;
}

function doGet(request) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const expectedCode = properties.getProperty('ACCESS_CODE');
    const suppliedCode = request && request.parameter && request.parameter.code;

    if (!expectedCode || suppliedCode !== expectedCode) {
      return jsonResponse({ ok: false, error: 'Unauthorized request.' });
    }

    if (request.parameter.action === 'result' && request.parameter.requestId) {
      const savedResult = CacheService.getScriptCache().get('create:' + request.parameter.requestId);
      return jsonResponse(savedResult ? JSON.parse(savedResult) : { ok: false, pending: true });
    }

    const calendarId = properties.getProperty('CALENDAR_ID') || 'primary';
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const start = request.parameter.timeMin ? new Date(request.parameter.timeMin) : defaultStart;
    const end = request.parameter.timeMax ? new Date(request.parameter.timeMax) : defaultEnd;
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return jsonResponse({ ok: false, error: 'The requested calendar range is invalid.' });
    }
    const calendarInfo = Calendar.Calendars.get(calendarId);
    const calendarColors = Calendar.Colors.get();
    let calendarListEntry = {};
    try {
      calendarListEntry = Calendar.CalendarList.get(calendarId);
    } catch (calendarListError) {
      // Event colors can still be shown if the calendar-list entry is unavailable.
    }
    const calendarEvents = listCalendarEvents(calendarId, start, end);
    const events = calendarEvents.map(function(event) {
      const privateData = event.extendedProperties && event.extendedProperties.private || {};
      const description = event.description || '';
      const notesMatch = description.match(/(?:^|\n)Notes:\s*([^\n]*)/i);
      const assignmentNotes = privateData.assignmentNotes || (notesMatch ? notesMatch[1].trim() : '');
      const personnelMatch = description.match(/(?:^|\n)Personnel:\s*([^\n]*)/i);
      const withLines = description
        .split(/\r?\n/)
        .map(function(line) { return line.trim(); })
        .filter(function(line) { return /^WITH\s+/i.test(line); });
      // Calendar descriptions can contain contextual lines such as "With CJ"
      // before the actual assignment. The final WITH line is the saved personnel.
      const withPersonnel = withLines.length
        ? withLines[withLines.length - 1].replace(/^WITH\s+/i, '')
        : '';
      const descriptionPersonnel = personnelMatch
        ? personnelMatch[1].trim()
        : withPersonnel
          ? withPersonnel.split(/\s+AND\s+/i).map(function(name) { return name.trim(); }).filter(Boolean).join(', ')
          : '';
      const eventColor = event.colorId && calendarColors.event
        ? calendarColors.event[event.colorId]
        : null;
      const fallbackColor = calendarListEntry.backgroundColor
        ? {
            background: calendarListEntry.backgroundColor,
            foreground: calendarListEntry.foregroundColor || '#ffffff'
          }
        : calendarListEntry.colorId && calendarColors.calendar
          ? calendarColors.calendar[calendarListEntry.colorId]
          : null;
      return {
        // CalendarApp expects the iCalendar UID when an assignment is saved.
        id: event.iCalUID || event.id,
        summary: event.summary || 'Untitled event',
        location: event.location || '',
        // Preserve the source description so the client can also recover legacy
        // assignments when an extended property is unavailable.
        description: description,
        personnel: privateData.personnel || descriptionPersonnel,
        personnelEmail: privateData.personnelEmail || '',
        assignmentNotes: assignmentNotes,
        guests: [],
        status: event.status || 'confirmed',
        colorId: event.colorId || '',
        color: eventColor || fallbackColor,
        start: event.start || {},
        end: event.end || {}
      };
    });

    const response = {
      ok: true,
      calendarName: calendarInfo.summary || calendarId,
      timeZone: calendarInfo.timeZone || Session.getScriptTimeZone(),
      events: events
    };
    return jsonResponse(response);
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) });
  }
}

function doPost(request) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const expectedCode = properties.getProperty('ACCESS_CODE');
    const values = request && request.parameter ? request.parameter : {};

    if (!expectedCode || values.code !== expectedCode) {
      return jsonResponse({ ok: false, error: 'Unauthorized request.' });
    }
    const calendarId = properties.getProperty('CALENDAR_ID') || 'primary';
    const calendar = calendarId === 'primary'
      ? CalendarApp.getDefaultCalendar()
      : CalendarApp.getCalendarById(calendarId);
    if (!calendar) return jsonResponse({ ok: false, error: 'Calendar was not found.' });

    if (values.action === 'delete') {
      if (!values.eventId) {
        return jsonResponse({ ok: false, error: 'Calendar event is required.' });
      }
      const eventToDelete = findCalendarEvent(calendar, values.eventId, values.eventStart);
      if (!eventToDelete) {
        return jsonResponse({
          ok: true,
          id: values.eventId,
          alreadyDeleted: true,
          message: 'Calendar event was already deleted.'
        });
      }
      eventToDelete.deleteEvent();
      return jsonResponse({
        ok: true,
        id: values.eventId,
        message: 'Calendar event deleted.'
      });
    }

    if (values.action === 'assign') {
      if (!values.eventId || !values.personnel) {
        return jsonResponse({ ok: false, error: 'Calendar event and personnel are required.' });
      }
      const assignmentEmails = String(values.personnelEmail || '').split(',').map(function(email) { return email.trim(); }).filter(Boolean);
      if (assignmentEmails.some(function(email) { return !isValidEmail(email); })) {
        return jsonResponse({ ok: false, error: 'A valid personnel email is required.' });
      }
      let assignedEvent = calendar.getEventById(values.eventId);
      if (values.eventStart) {
        const selectedStart = new Date(values.eventStart);
        const searchStart = new Date(selectedStart.getTime() - 60000);
        const searchEnd = new Date(selectedStart.getTime() + 60000);
        const matchingEvents = calendar.getEvents(searchStart, searchEnd).filter(function(event) {
          return event.getId() === values.eventId && event.getStartTime().getTime() === selectedStart.getTime();
        });
        if (matchingEvents.length) assignedEvent = matchingEvents[0];
      }
      if (!assignedEvent) return jsonResponse({ ok: false, error: 'The selected calendar event was not found.' });

      const legacyMarker = '\n\n--- Personnel Travel Assignment ---';
      let originalDescription = assignedEvent.getTag('originalDescription');
      if (assignedEvent.getTag('assignmentManaged') !== 'true') {
        originalDescription = (assignedEvent.getDescription() || '').split(legacyMarker)[0];
        assignedEvent.setTag('originalDescription', originalDescription);
        assignedEvent.setTag('assignmentManaged', 'true');
      }

      // App-created events used to preserve their first assignment as source text.
      // Clean that saved source too, so previously edited events are repaired.
      const appCreated = assignedEvent.getTag('travelCreated') === 'true' || /(?:^|\n)Personnel:/i.test(originalDescription || '');
      if (appCreated) {
        assignedEvent.setTag('travelCreated', 'true');
        originalDescription = (originalDescription || '').split(/\r?\n/)
          .filter(function(line) { return !/^\s*(?:Personnel:|Notes:|WITH\s+)/i.test(line); })
          .join('\n').trim();
        assignedEvent.setTag('originalDescription', originalDescription);
      }
      const previousEmails = String(assignedEvent.getTag('personnelEmail') || '').split(',')
        .map(function(email) { return email.trim().toLowerCase(); }).filter(Boolean);
      const wantedEmails = assignmentEmails.map(function(email) { return email.toLowerCase(); });
      const newRecipientEmails = assignmentEmails.filter(function(email) {
        return previousEmails.indexOf(email.toLowerCase()) === -1;
      });
      const currentGuests = assignedEvent.getGuestList().map(function(guest) { return guest.getEmail(); });
      currentGuests.forEach(function(email) {
        const normalized = email.toLowerCase();
        if ((appCreated || previousEmails.indexOf(normalized) !== -1) && wantedEmails.indexOf(normalized) === -1) {
          assignedEvent.removeGuest(email);
        }
      });
      assignmentEmails.forEach(function(email) {
        if (!currentGuests.some(function(current) { return current.toLowerCase() === email.toLowerCase(); })) {
          assignedEvent.addGuest(email);
        }
      });
      assignedEvent.setTag('personnel', values.personnel);
      assignedEvent.setTag('personnelEmail', assignmentEmails.join(', '));
      assignedEvent.setTag('assignmentNotes', values.notes || '');

      const names = values.personnel
        .split(',')
        .map(function(name) { return name.trim().toUpperCase(); })
        .filter(Boolean);
      const assignmentLines = [
        appCreated ? 'Personnel: ' + values.personnel : 'WITH ' + names.join(' AND '),
        values.notes ? 'Notes: ' + values.notes : ''
      ].filter(Boolean);
      const updatedDescription = [originalDescription, assignmentLines.join('\n')]
        .filter(Boolean)
        .join('\n\n');
      assignedEvent.setDescription(updatedDescription);
      const emailResult = newRecipientEmails.length
        ? sendItineraryEmails(assignedEvent, values.personnel, values.notes || '', calendar, newRecipientEmails.join(', '))
        : { sent: [], missing: [], failed: [] };
      emailResult.recipients = newRecipientEmails;
      return jsonResponse({
        ok: true,
        id: assignedEvent.getId(),
        message: 'Personnel assigned to calendar event.',
        email: emailResult
      });
    }

    if (!values.title || !values.start || !values.end) {
      return jsonResponse({ ok: false, error: 'Title, start, and end are required.' });
    }

    const personnelEmails = String(values.personnelEmail || '').split(',').map(function(email) { return email.trim(); }).filter(Boolean);
    if (personnelEmails.some(function(email) { return !isValidEmail(email); })) {
      return jsonResponse({ ok: false, error: 'A valid personnel email is required.' });
    }

    const start = new Date(values.start);
    const end = new Date(values.end);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return jsonResponse({ ok: false, error: 'The travel date or time range is invalid.' });
    }

    const description = [
      values.personnel ? 'Personnel: ' + values.personnel : '',
      values.purpose ? 'Purpose: ' + values.purpose : '',
      values.notes ? 'Notes: ' + values.notes : ''
    ].filter(Boolean).join('\n');

    const event = values.allDay === 'true'
      ? calendar.createAllDayEvent(values.title, start, end, {
          location: values.location || '',
          description: description
        })
      : calendar.createEvent(values.title, start, end, {
          location: values.location || '',
          description: description
        });
    if (values.colorId && EVENT_COLORS_BY_ID[values.colorId]) {
      event.setColor(EVENT_COLORS_BY_ID[values.colorId]);
    }
    event.setTag('personnel', values.personnel || '');
    event.setTag('travelCreated', 'true');
    if (values.personnelEmail) {
      event.setTag('personnelEmail', values.personnelEmail.trim());
      personnelEmails.forEach(function(email) { event.addGuest(email); });
    }

    const emailResult = values.personnelEmail
      ? sendItineraryEmails(event, values.personnel, values.notes || '', calendar, values.personnelEmail, values.purpose || '')
      : { sent: [], missing: [], failed: [] };

    const createdResult = {
      ok: true,
      id: event.getId(),
      email: emailResult,
      event: {
        id: event.getId(),
        summary: event.getTitle(),
        location: event.getLocation() || '',
        description: description,
        personnel: values.personnel || '',
        personnelEmail: values.personnelEmail ? values.personnelEmail.trim() : '',
        assignmentNotes: values.notes || '',
        guests: [],
        status: 'confirmed',
        colorId: values.colorId || '',
        start: values.allDay === 'true'
          ? { date: Utilities.formatDate(start, Session.getScriptTimeZone(), 'yyyy-MM-dd') }
          : { dateTime: start.toISOString() },
        end: values.allDay === 'true'
          ? { date: Utilities.formatDate(end, Session.getScriptTimeZone(), 'yyyy-MM-dd') }
          : { dateTime: end.toISOString() }
      },
      message: 'Travel schedule created.'
    };
    if (values.requestId) {
      CacheService.getScriptCache().put('create:' + values.requestId, JSON.stringify(createdResult), 21600);
    }
    return jsonResponse(createdResult);
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || String(error) });
  }
}

function findCalendarEvent(calendar, eventId, eventStart) {
  let calendarEvent = calendar.getEventById(eventId);
  if (!eventStart) return calendarEvent;

  const selectedStart = new Date(eventStart);
  if (isNaN(selectedStart.getTime())) return null;
  const searchStart = new Date(selectedStart.getTime() - 60000);
  const searchEnd = new Date(selectedStart.getTime() + 60000);
  const matchingEvents = calendar.getEvents(searchStart, searchEnd).filter(function(event) {
    return event.getId() === eventId && event.getStartTime().getTime() === selectedStart.getTime();
  });
  return matchingEvents.length ? matchingEvents[0] : calendarEvent;
}

function listCalendarEvents(calendarId, start, end) {
  const events = [];
  let pageToken = '';
  do {
    const options = {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      showDeleted: false,
      maxResults: 2500,
      fields: 'items(iCalUID,id,summary,location,description,extendedProperties/private,status,start,end,colorId),nextPageToken'
    };
    if (pageToken) options.pageToken = pageToken;
    const result = Calendar.Events.list(calendarId, options);
    events.push.apply(events, result.items || []);
    pageToken = result.nextPageToken || '';
  } while (pageToken);
  return events;
}

function sendItineraryEmails(event, personnelValue, assignmentNotes, calendar, directEmail, purpose) {
  const recipients = Array.from(new Set(String(directEmail || '').split(',').map(function(email) { return email.trim(); }).filter(Boolean)));
  const names = String(personnelValue || '')
    .split(',')
    .map(function(name) { return name.trim(); })
    .filter(Boolean);
  const timeZone = calendar.getTimeZone() || Session.getScriptTimeZone();
  const allDay = event.isAllDayEvent();
  const dateFormat = 'EEEE, MMMM d, yyyy';
  const start = Utilities.formatDate(event.getStartTime(), timeZone, dateFormat);
  // All-day end dates are exclusive; display the final included day.
  const end = Utilities.formatDate(new Date(event.getEndTime().getTime() - (allDay ? 1 : 0)), timeZone, dateFormat);
  const date = start === end ? start : start + ' to ' + end;
  const subject = 'Travel Itinerary: ' + event.getTitle();
  const sent = [];
  const missing = [];
  const failed = [];

  // Send one shared itinerary with all personnel addresses in the To header.
  const name = names.join(', ') || 'Personnel';
  try {
    const email = recipients.join(', ');
    if (!email) {
      return { sent: [], missing: names, failed: [] };
    }
    const textBody = [
      'Dear ' + name + ',',
      '',
      'Your travel schedule has been recorded. Please review the event details below:',
      'Travel: ' + event.getTitle(),
      'Personnel: ' + name,
      'Date: ' + date,
      'Location: ' + (event.getLocation() || 'Not specified'),
      purpose ? 'Purpose: ' + purpose : '',
      assignmentNotes ? 'Notes: ' + assignmentNotes : '',
      '',
      'Please verify these details and contact the coordinating office if any changes are required.',
      '',
      'Respectfully,',
      'J.H. Cerilles State College Office of the President',
      'This is an automated notification.'
    ].join('\n');
    const htmlBody = [
      '<!DOCTYPE html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b">',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:32px 12px">',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">',
      '<tr><td bgcolor="#68152b" style="background-color:#68152b;background-image:linear-gradient(110deg,#3b0d19 0%,#7c2039 100%);padding:28px 32px;color:#ffffff"><p style="margin:0 0 10px;font-size:12px;letter-spacing:2px;color:#efb8c5">PERSONNEL TRAVEL SYSTEM</p><h1 style="margin:0;font-size:24px">Travel Schedule Notification</h1></td></tr>',
      '<tr><td style="padding:28px 32px;font-size:15px;line-height:1.7">',
      '<p style="margin-top:0">Dear ' + escapeHtml(name) + ',</p>',
      '<p>Your travel schedule has been recorded. Please review the event details below.</p>',
      '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">',
      itineraryRow('Travel', event.getTitle()),
      itineraryRow('Personnel', name),
      itineraryRow('Date', date),
      itineraryRow('Location', event.getLocation() || 'Not specified'),
      purpose ? itineraryRow('Purpose', purpose) : '',
      assignmentNotes ? itineraryRow('Notes', assignmentNotes) : '',
      '</table>',
      '<p>Please verify these details and contact the coordinating office if any changes are required.</p>',
      '<p style="margin-bottom:0">Respectfully,<br><strong>J.H. Cerilles State College Office of the President</strong></p>',
      '</td></tr><tr><td style="padding:18px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px">This is an automated notification from the Personnel Travel System.</td></tr>',
      '</table></td></tr></table></body></html>'
    ].join('');
    sendGmailItinerary(email, subject, textBody, htmlBody);
    sent.push(name);
  } catch (error) {
    failed.push({ name: name, error: error.message || String(error) });
  }

  return { sent: sent, missing: missing, failed: failed };
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function sendGmailItinerary(recipient, subject, textBody, htmlBody) {
  const boundary = 'personnel_travel_' + Utilities.getUuid().replace(/-/g, '');
  const encodedSubject = '=?UTF-8?B?' + Utilities.base64Encode(subject, Utilities.Charset.UTF_8) + '?=';
  const encodedText = Utilities.base64Encode(textBody, Utilities.Charset.UTF_8);
  const encodedHtml = Utilities.base64Encode(htmlBody, Utilities.Charset.UTF_8);
  const mimeMessage = [
    'To: ' + recipient,
    'Subject: ' + encodedSubject,
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' + boundary + '"',
    '',
    '--' + boundary,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodedText,
    '--' + boundary,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    encodedHtml,
    '--' + boundary + '--'
  ].join('\r\n');

  Gmail.Users.Messages.send({
    raw: Utilities.base64EncodeWebSafe(mimeMessage, Utilities.Charset.UTF_8)
  }, 'me');
}

function itineraryRow(label, value) {
  return '<tr><th style="border:1px solid #d0d5dd;padding:8px;text-align:left;background:#f2f4f7">' +
    escapeHtml(label) + '</th><td style="border:1px solid #d0d5dd;padding:8px">' +
    escapeHtml(value).replace(/\r?\n/g, '<br>') + '</td></tr>';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
