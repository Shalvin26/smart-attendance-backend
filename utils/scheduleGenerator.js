const generateSchedule = (semesterStart, semesterEnd, lectureDays, subjectId, teacherId) => {

  // mapping of days to numbers
  const dayMap = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };

  // Convert lecture day names to numbers
  // e.g ['Monday', 'Wednesday'] → [1, 3]
  const lectureDayNumbers = lectureDays.map(day => dayMap[day]);

  const schedules = [];
  let lectureNumber = 1;

  // Start from semester start date
  let current = new Date(semesterStart);
  const end = new Date(semesterEnd);

  // Loop day by day until semester ends
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday

    // If today is a lecture day
    if (lectureDayNumbers.includes(dayOfWeek)) {
      schedules.push({
        subjectId,
        teacherId,
        date: new Date(current),
        dayOfWeek: lectureDays[lectureDayNumbers.indexOf(dayOfWeek)],
        lectureNumber,
        status: 'upcoming'
      });
      lectureNumber++;
    }

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  return schedules;
};

module.exports = generateSchedule;