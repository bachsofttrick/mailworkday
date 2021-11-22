const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const { g_calendar } = require('./appConfig.json');

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, date = null, comment = '') {
  date = date || new Date();
  const {client_secret, client_id, redirect_uris} = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(g_calendar.TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback, date, comment);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, date, comment);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback, date = null, comment = '') {
  date = date || new Date();
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: g_calendar.SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(decodeURIComponent(code), (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(g_calendar.TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', g_calendar.TOKEN_PATH);
      });
      callback(oAuth2Client, date, comment);
    });
  });
}

// Load client secrets from a local file.
function startProg(date = null, comment = '') {
  date = date || new Date();
  fs.readFile(g_calendar.CREDENTIAL_PATH, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Calendar API.
    authorize(JSON.parse(content), run, date, comment);
  });
}

/**
 * Run command
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function run(auth, date = null, comment = '') {
  date = date || new Date();
  const calendar = google.calendar({version: 'v3', auth});
  calendar.calendarList.list((err, rs) => {
    if (err) return response(err);
    const wwCalendar = rs.data.items.find(r => r.summary === g_calendar.calendarName);
    if (wwCalendar) {
      const calendarId = wwCalendar.id;
      createEvent(calendar, calendarId, date, comment);
    } else {
      calendar.calendars.insert({requestBody: {
        summary: g_calendar.calendarName
      }}, (err, rs) => {
        if (err) return response(err);
        createEvent(calendar, rs.id, date, comment);
      });
    }
  });
}

function createEvent(calendar, calendarId, date = null, comment = '') {
  date = date || new Date();
  const [startDate, endDate] = [new Date(date.setHours(7, 0, 0)), (new Date(date.setHours(8, 0, 0)))];
  calendar.events.list({calendarId}, (err, rs) => {
    if (err) return response(err);
    const wwDay = rs.data.items.find(r => r.summary === g_calendar.eventName);
    if (wwDay) calendar.events.delete({calendarId, eventId: wwDay.id});
    calendar.events.insert({
      requestBody: {
          summary: g_calendar.eventName,
          description: comment,
          start: {dateTime: startDate.toISOString()},
          end: {dateTime: endDate.toISOString()},
          reminders: {useDefault: false, overrides: [{method: 'popup', minutes: 10}]}
      }, calendarId
    }, response);
  });
}

function response(err, rs) {
  if (err) return console.log('The API returned an error: ' + err);
  if (rs.data.items) {
      console.log(rs.data.items);
  } else {
      console.log(rs.data);
  }
}

module.exports = startProg;