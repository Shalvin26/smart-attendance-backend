const parseLectureDays = (input) => {
  // Split by comma or space or both
  const days = input
    // split if it finds  comma or space or multiple spaces
    .split(/[\s,]+/) 
    // remove extra spaces
    .map(day => day.trim())
    // capitalize properly like (Monday )
    .map(day => day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()) 
    .filter(day => day !== ''); // remove empty strings

  // Valid days only
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const invalid = days.filter(day => !validDays.includes(day));
  if (invalid.length > 0) {
    throw new Error(`Invalid days: ${invalid.join(', ')}`);
  }

  return days;
};

module.exports = parseLectureDays;