const autoTable = require('jspdf-autotable');
console.log(typeof autoTable);
console.log(Object.keys(autoTable));
const { jsPDF } = require('jspdf');
const doc = new jsPDF();
if (typeof doc.autoTable === 'function') {
    console.log('doc.autoTable is a function. I can just use it!');
} else {
    console.log('doc.autoTable is not a function.');
}
