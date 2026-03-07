const { generatePDFReport } = require('./src/utils/reportExporter');

try {
    const dummyData = {
        summary: { total_sales: 100 },
        dailyBreakdown: []
    };
    const doc = generatePDFReport(dummyData, 'sales', 'Sales Report');
    console.log("PDF generation successful!");
    console.log("Previous Y:", doc.lastAutoTable ? doc.lastAutoTable.finalY : 'undefined');
} catch (e) {
    console.error("PDF generation failed:");
    console.error(e);
}
