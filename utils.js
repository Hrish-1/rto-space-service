// Utility function to generate EntryID
function generateEntryID() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString().slice(2, 5);
    return `${year}${month}-${random}`;
  }

  export default generateEntryID