const { weekdays, months } = require('./translate');

function getOccuringTimesOfDayOfWeek(dayOfWeek, date = null) {
    // dayOfWeek: Sunday is 0, Monday is 1, and so on.
    date = date || new Date();
    // reset to 0h
    date = new Date(date.toDateString());
    const firstDateOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const nextWeekDayOfFirstDate = getNextDayOfWeek(dayOfWeek, firstDateOfMonth);
    const goToWorkWeekendDay = getNextDayOfWeek(dayOfWeek, date);
    let weeks = 1;
    if (date.getMonth() === goToWorkWeekendDay.getMonth() && date >= nextWeekDayOfFirstDate) {
        weeks += parseInt(1 + ((date - nextWeekDayOfFirstDate) / (86400000*7)));
    }
  
    return [weeks, goToWorkWeekendDay];
}

function getNextDayOfWeek(dayOfWeek, date = null) {
    // Get the next day of week, even if date is on the day of week
    // dayOfWeek: Sunday is 0, Monday is 1, and so on.
    date = date || new Date();
    if (!(dayOfWeek >= 0 && dayOfWeek <= 6)) dayOfWeek = 0;
    const resultDate = new Date(date.toDateString());
    resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay() - 1) % 7 + 1);
    return resultDate;
}

function translateDate(date = null) {
    date = date || new Date();
    const dateArray = date.toDateString().split(' ');
    return `${weekdays.find((i) => i.name === dateArray[0]).translate} ngày ${dateArray[2]} tháng ${months.indexOf(dateArray[1])} năm ${dateArray[3]}`;
}

module.exports = {
    getOccuringTimesOfDayOfWeek,
    getNextDayOfWeek,
    translateDate
}