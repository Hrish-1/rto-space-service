import SerialNumber from './models/serialNumber.js'; // Import the SerialNumber schema

async function generateEntryID() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleString('default', { month: 'short' }).toLowerCase();
  const yearMonth = `${year}${month}`;


  
  // Find the document for the current yearMonth or create if it doesn't exist
  let serialDoc = await SerialNumber.findOneAndUpdate(
    { yearMonth },
    { $inc: { serial: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // If the month has changed, reset the serial number
  if (!serialDoc) {
    serialDoc = await SerialNumber.create({ yearMonth, serial: 1 });
  }

  // Return the formatted EntryID
  const serialStr = serialDoc.serial.toString().padStart(3, '0');
  return `${yearMonth}-${serialStr}`;
}

export default generateEntryID;
