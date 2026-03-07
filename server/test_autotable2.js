const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;

const doc = new jsPDF();
autoTable(doc, {
    head: [['A', 'B']],
    body: [['1', '2']]
});
console.log('lastAutoTable:', !!doc.lastAutoTable);
console.log('finalY:', doc.lastAutoTable ? doc.lastAutoTable.finalY : 'undefined');
