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
async function convertToRupeesInWords(amount) {
  const words = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

 function numToWords(num, appendSuffix) {
    let str = '';
    if (num > 19) {
      str += tens[parseInt(num / 10)] + (num % 10 ? ' ' : '') + words[num % 10];
    } else {
      str += words[num];
    }
    if (num && appendSuffix) {
      str += appendSuffix;
    }
    return str;
  }

  function getLakhs(lakhs) {
    if (lakhs) {
      return numToWords(lakhs, ' Lakh ');
    }
    return '';
  }

  function getThousands(thousands) {
    if (thousands) {
      return numToWords(thousands, ' Thousand ');
    }
    return '';
  }

  function getHundreds(hundreds) {
    if (hundreds) {
      return numToWords(hundreds, ' Hundred ');
    }
    return '';
  }

  if (amount === 0) return 'Zero';
  
  if (amount < 0) return 'Minus ' + convertToRupeesInWords(Math.abs(amount));

  const crores = parseInt(amount / 10000000);
  amount %= 10000000;
  const lakhs = parseInt(amount / 100000);
  amount %= 100000;
  const thousands = parseInt(amount / 1000);
  amount %= 1000;
  const hundreds = parseInt(amount / 100);
  amount %= 100;
  const tensAndUnits = amount;

  const crorePart = crores ? numToWords(crores, ' Crore ') : '';
  const lakhPart = getLakhs(lakhs);
  const thousandPart = getThousands(thousands);
  const hundredPart = getHundreds(hundreds);
  const tensAndUnitsPart = numToWords(tensAndUnits, '');

  const rupeesInWords = crorePart + lakhPart + thousandPart + hundredPart + tensAndUnitsPart;

  return rupeesInWords.trim() + ' Only';
}

export  {  generateEntryID, convertToRupeesInWords };
