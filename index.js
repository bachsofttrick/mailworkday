const nodemailer = require('nodemailer');
const config = require('./appConfig.json');
const { getOccuringTimesOfDayOfWeek, translateDate } = require('./lib');
const writeWorkEvent = require('./g-calendar');
const now = new Date();

const workWeekend = getOccuringTimesOfDayOfWeek(config.workWeekendDay, now);
const goToWorkSat = config.weekGoToWork.includes(workWeekend[0]);
const notiBody = `Tuần này ${translateDate(workWeekend[1])} là tuần thứ ${workWeekend[0]}${goToWorkSat ? '' : ' không'} phải đi làm nha!`;
// send email
// only 1 day before get send email
if (config.email.enable && now.getDay() === config.email.dayJobRun) {
  const transporter = nodemailer.createTransport(config.email.nodemailer);
  transporter.sendMail({
      from: config.email.from,
      to: config.email.to,
      subject: config.email.subject,
      text: notiBody
  }, (err, info) => {
      if (err) {
        return console.log(err);
      }
      console.log(info);
  });
}

// set event in Google calendar
if (config.g_calendar.enable && now.getDay() === config.g_calendar.dayJobRun && goToWorkSat) {
  writeWorkEvent(workWeekend[1], notiBody);
}
