const fs = require('fs');
const schedule = JSON.parse(fs.readFileSync('schedule.json', 'utf8'));

const days = {
  friday: { date: '20250725' },
  saturday: { date: '20250726' },
  sunday: { date: '20250727' }
};

function parseTime(timeStr) {
  const [hm, ampm] = timeStr.split(' ');
  let [h, m] = hm.split(':').map(Number);
  if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
  return { h, m };
}

function pad(n) { return n.toString().padStart(2, '0'); }

function formatDate(date, time) {
  return `${date}${pad(time.h)}${pad(time.m)}00`;
}

let out = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Open Sauce Schedule//EN`;

for (const [dayName, { date }] of Object.entries(days)) {
  const events = schedule[dayName] || [];
  for (const ev of events) {
    const startTime = parseTime(ev.time);
    const start = formatDate(date, startTime);
    const length = parseInt(ev.length || '30', 10);
    const endDate = new Date(Date.UTC(
      Number(date.slice(0,4)),
      Number(date.slice(4,6)) - 1,
      Number(date.slice(6,8)),
      startTime.h,
      startTime.m
    ));
    const endDateObj = new Date(endDate.getTime() + length * 60000);
    const end = `${endDateObj.getUTCFullYear()}${pad(endDateObj.getUTCMonth()+1)}${pad(endDateObj.getUTCDate())}${pad(endDateObj.getUTCHours())}${pad(endDateObj.getUTCMinutes())}00`;

    const descriptionParts = [];
    if (ev.description) descriptionParts.push(ev.description);
    const speakerNames = (ev.speakers || []).map(s => s.name).join(', ');
    if (speakerNames) descriptionParts.push('Speakers: ' + speakerNames);
    if (ev.moderator && ev.moderator.name) descriptionParts.push('Moderator: ' + ev.moderator.name);
    const description = descriptionParts.join('\n').replace(/\n/g,'\\n');

    out += `\nBEGIN:VEVENT\nSUMMARY:${ev.title}\nDTSTART:${start}\nDTEND:${end}\nDESCRIPTION:${description}\nLOCATION:${ev.where}\nEND:VEVENT`;
  }
}

out += '\nEND:VCALENDAR\n';
fs.writeFileSync('schedule.ics', out);
