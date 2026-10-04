const { format, startOfWeek, endOfWeek, eachDayOfInterval, isSunday } = require('date-fns');

const currentWeek = new Date();
const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
const weekRange = eachDayOfInterval({ start, end });

const records = {
  "2026-10-03": {
    day_status: "absent",
    breakfast_status: "missed",
    lunch_status: "missed",
    late: false
  }
};
const settings = {
  workingDays: [1,2,3,4,5,6],
  sundayCompensation: true
};

let expectedDays = 0, attended = 0, absent = 0;
weekRange.forEach(day => {
  const isExpectedWorkDay = settings.workingDays.includes(day.getDay());
  const dateStr = format(day, 'yyyy-MM-dd');
  const rec = records[dateStr];

  if (isExpectedWorkDay) {
    expectedDays++;
  }

  if (rec) {
    if (rec.day_status !== 'absent' && rec.day_status !== 'holiday' && rec.day_status !== 'sunday_holiday') {
      attended++;
    }
    if (rec.day_status === 'absent' && isExpectedWorkDay && !rec.approved_leave) {
      absent++;
    }
  } else if (isExpectedWorkDay && dateStr < format(new Date(), 'yyyy-MM-dd')) {
    absent++;
  }
});

console.log({ expectedDays, attended, absent });
