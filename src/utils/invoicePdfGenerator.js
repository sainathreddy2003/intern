import jsPDF from 'jspdf';

const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;

  let result = '';
  if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
  if (remainder > 0) result += convertLessThanThousand(remainder);

  return result.trim();
};

export const generateInvoicePDF = (bill, settings = {}, mode = 'download') => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = 595.28; // Standard A4 pt width
  const margin = 30;
  const usableW = pageWidth - 2 * margin; // 535.28 pt
  let y = 30;

  const companyName = settings.invoice_company_name || settings.business_name || 'SRI PADMA CREATIONS';
  const companyAddress = settings.invoice_address || settings.business_address || 'No.25, VAIYAPURI NAGAR, KARUR - 639 002. TAMIL NADU.';
  const companyPhone = settings.invoice_phone || settings.business_phone || 'Tel: +91 93463 16949';
  const companyGSTIN = settings.invoice_gstin || settings.gst_no || 'GSTIN: 33AXSPP0283F1ZB';
  const placeOfSupply = settings.invoice_place_of_supply || 'Pondicherry';
  const bankAccount = settings.invoice_bank_account || '9218 2004 2413 534 (AXIS BANK, NO.126, KOVAI ROAD, KARUR - 639002)';
  const bankIFSC = settings.invoice_bank_ifsc || 'UTIB0000123';
  const termsText = settings.invoice_terms || 'a) Our Responsibility ceases once goods leave from our Premises.\nb) Please check the Quality and Quantity before usage. Any discrepancy is to be reported to us in writing within 4 days from the date of delivery.\nc) No Deduction shall be allowed whatsoever without our prior permission.\nd) Interest will be charged @ 21% Per annum, if this bill is not paid within the due date.\ne) Legal dispute, if any, is subject to Jurisdiction of court of Law in Karur.';

  // Helper draw methods
  const drawRowLine = (yPos, startX = margin, endX = margin + usableW) => doc.line(startX, yPos, endX, yPos);
  const drawVertLine = (xPos, yStart, yEnd) => doc.line(xPos, yStart, xPos, yEnd);

  // === 1. HEADER SECTION ===
  const rightW = usableW * 0.3;
  const leftW = usableW * 0.7;
  const headerH = 80;

  doc.rect(margin, y, usableW, headerH);
  drawVertLine(margin + leftW, y, y + headerH);

  // Top Right (Duplicate/Triplicate)
  drawRowLine(y + headerH / 2, margin + leftW);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Duplicate for Transporter', margin + leftW + rightW / 2, y + 23, { align: 'center' });
  doc.text('Triplicate for Supplier', margin + leftW + rightW / 2, y + 63, { align: 'center' });

  // Top Left (Company Details)
  const leftMid = margin + leftW / 2;
  doc.setFontSize(16);
  doc.setTextColor(255, 102, 0); // Orange
  doc.text(companyName, leftMid, y + 25, { align: 'center' });

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(companyAddress, leftMid, y + 42, { align: 'center' });
  doc.text(companyPhone, leftMid, y + 55, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(companyGSTIN, leftMid, y + 70, { align: 'center' });

  y += headerH;

  // === 2. TAX INVOICE TITLE === //
  doc.setFillColor(230, 230, 230);
  doc.rect(margin, y, usableW, 18, 'FD');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Tax Invoice', pageWidth / 2, y + 13, { align: 'center' });
  y += 18;

  // === 3. DETAILS BLOCK === //
  const detailsH = 60; // 4 rows of 15
  doc.rect(margin, y, usableW, detailsH);

  const halfW = usableW / 2;
  const qLeft = margin + halfW * 0.40; // Indent for variable
  const midX = margin + halfW;
  const qRight = midX + halfW * 0.40;

  drawVertLine(midX, y, y + detailsH);
  drawVertLine(qLeft, y, y + detailsH);
  drawVertLine(qRight, y, y + detailsH);

  for (let i = 1; i < 4; i++) drawRowLine(y + (i * 15));

  const formattedDate = new Date(bill.billDate || bill.createdAt).toLocaleDateString('en-GB').replace(/\//g, '.');

  const printRowInfo = (offsetY, lab1, val1, lab2, val2) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    // Left Block label/value
    doc.text(lab1, margin + 4, offsetY);
    doc.setFont('helvetica', 'bold');
    doc.text(val1, qLeft + 4, offsetY);
    // Right Block label/value
    doc.setFont('helvetica', 'normal');
    doc.text(lab2, midX + 4, offsetY);
    doc.setFont('helvetica', 'bold');
    doc.text(val2, qRight + 4, offsetY);
  };

  printRowInfo(y + 11, 'Invoice No:', bill.invoiceNo || '', 'Transport Mode:', '');
  printRowInfo(y + 15 + 11, 'Invoice Date:', formattedDate, 'Vehicle number:', '');
  printRowInfo(y + 30 + 11, 'Reverse Charge (Y/N):', 'N', 'Date of Supply:', formattedDate);
  printRowInfo(y + 45 + 11, 'State:            Code:', '', 'Place of Supply:', placeOfSupply);

  y += detailsH;

  // === 4. BILL TO / SHIP TO === //
  const partyH = 75;
  doc.rect(margin, y, halfW, partyH);
  doc.rect(midX, y, halfW, partyH);

  doc.setFillColor(230, 230, 230);
  doc.rect(margin, y, usableW, 16, 'FD');
  drawVertLine(midX, y, y + 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill to Party', margin + 5, y + 11.5);
  doc.text('Ship to Party', midX + 5, y + 11.5);

  const drawPartyInfo = (offsetX) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Name:', offsetX + 5, y + 28);
    doc.setFont('helvetica', 'bold');
    doc.text((bill.customerName || 'Cash Customer').substring(0, 40), offsetX + 45, y + 28);

    doc.setFont('helvetica', 'normal');
    doc.text('Address:', offsetX + 5, y + 42);
    const addr = bill.customerAddress || '';
    doc.text(addr.substring(0, 45), offsetX + 45, y + 42);
    if (addr.length > 45) {
      doc.text(addr.substring(45, 90), offsetX + 45, y + 54);
    }

    if (bill.customerMobile) {
      doc.text(`Mobile: ${bill.customerMobile}`, offsetX + 5, y + 68);
    }
  };

  drawPartyInfo(margin);
  drawPartyInfo(midX);

  y += partyH + 8; // Small spacing before table

  // === 5. ITEMS TABLE === //
  const col = {
    sl: 25,
    hsn: 40,
    uom: 30,
    qty: 35,
    rate: 40,
    amt: 45,
    disc: 35,
    taxVal: 45,
    igstRte: 35,
    igstAmt: 45,
    tot: 55,
  };
  const fixedSum = Object.values(col).reduce((a, b) => a + b, 0);
  col.desc = usableW - fixedSum;

  const totalHeaderH = 26;
  const subH = 13;
  const tableTop = y;

  // Outer Table Grid Outline
  doc.rect(margin, y, usableW, totalHeaderH);
  doc.line(margin, y + totalHeaderH, margin + usableW, y + totalHeaderH);

  let tx = margin;
  const headerVert = (w, h = totalHeaderH, startY = tableTop) => {
    tx += w;
    drawVertLine(tx, startY, startY + h);
  };

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  const txtY = tableTop + 13.5;

  doc.text('Sl.\nNo.', margin + col.sl / 2, tableTop + 10, { align: 'center' }); headerVert(col.sl);
  doc.text('Product Description', tx + col.desc / 2, txtY, { align: 'center' }); headerVert(col.desc);
  doc.text('HSN', tx + col.hsn / 2, txtY, { align: 'center' }); headerVert(col.hsn);
  doc.text('UOM', tx + col.uom / 2, txtY, { align: 'center' }); headerVert(col.uom);
  doc.text('Qty', tx + col.qty / 2, txtY, { align: 'center' }); headerVert(col.qty);
  doc.text('Rate', tx + col.rate / 2, txtY, { align: 'center' }); headerVert(col.rate);
  doc.text('Amount', tx + col.amt / 2, txtY, { align: 'center' }); headerVert(col.amt);
  doc.text('Disc', tx + col.disc / 2, txtY, { align: 'center' }); headerVert(col.disc);
  doc.text('Taxable\nValue', tx + col.taxVal / 2, tableTop + 10, { align: 'center' }); headerVert(col.taxVal);

  const igstParentX = tx;
  doc.text('IGST', igstParentX + (col.igstRte + col.igstAmt) / 2, tableTop + 9.5, { align: 'center' });
  doc.line(igstParentX, tableTop + subH, tx + col.igstRte + col.igstAmt, tableTop + subH);

  let splitX = igstParentX;
  doc.text('Rate', splitX + col.igstRte / 2, tableTop + subH + 9, { align: 'center' });
  drawVertLine(splitX + col.igstRte, tableTop + subH, tableTop + totalHeaderH);
  splitX += col.igstRte;
  doc.text('Amount', splitX + col.igstAmt / 2, tableTop + subH + 9, { align: 'center' });

  tx = igstParentX + col.igstRte + col.igstAmt;
  drawVertLine(tx, tableTop, tableTop + totalHeaderH);

  doc.text('Total', tx + col.tot / 2, txtY, { align: 'center' });

  y += totalHeaderH;

  const rowH = 16;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  let totalQty = 0, totalAmt = 0, totalDisc = 0, totalTaxable = 0, totalTaxAmt = 0, finalNet = 0;
  const items = bill.items || [];

  items.forEach((item, index) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const amount = qty * rate;
    const discount = Number(item.discountAmount) || 0;
    const taxable = amount - discount;
    const taxAmt = Number(item.taxAmount) || 0;
    const total = Number(item.amount) || (taxable + taxAmt);
    const iRate = Number(item.taxRate || 5);

    totalQty += qty;
    totalAmt += amount;
    totalDisc += discount;
    totalTaxable += taxable;
    totalTaxAmt += taxAmt;
    finalNet += total;

    // Row borders
    drawVertLine(margin, y, y + rowH);
    drawVertLine(margin + usableW, y, y + rowH);
    drawRowLine(y + rowH);

    let px = margin;
    const putVal = (val, w, align = 'center') => {
      const xAlign = align === 'right' ? px + w - 3 : (align === 'center' ? px + w / 2 : px + 3);
      doc.text(val.toString(), xAlign, y + 11.5, { align: align });
      px += w;
      drawVertLine(px, y, y + rowH);
    };

    putVal((index + 1), col.sl, 'center');

    // Left aligned truncation for strings
    const descLen = Math.floor(col.desc / 4.5);
    putVal((item.name || '').substring(0, descLen), col.desc, 'left');

    putVal(item.barcode || item.code || '5212', col.hsn, 'center');
    putVal(item.uom || 'Mtr', col.uom, 'center');
    putVal(qty.toFixed(2), col.qty, 'right');
    putVal(rate.toFixed(2), col.rate, 'right');
    putVal(amount.toFixed(2), col.amt, 'right');
    putVal(discount > 0 ? discount.toFixed(2) : '', col.disc, 'right');
    putVal(taxable.toFixed(2), col.taxVal, 'right');
    putVal(iRate + '%', col.igstRte, 'center');
    putVal(taxAmt > 0 ? taxAmt.toFixed(2) : '', col.igstAmt, 'right');

    doc.text(total.toFixed(2), px + col.tot - 3, y + 11.5, { align: 'right' });
    y += rowH;

    // Minimum sanity check for large lists
    if (y > 750 && index !== items.length - 1) {
      doc.addPage();
      y = margin;
    }
  });

  // Items Total Footer
  doc.rect(margin, y, usableW, rowH);
  doc.setFont('helvetica', 'bold');

  let ftX = margin + col.sl + col.desc + col.hsn + col.uom;
  drawVertLine(ftX, y, y + rowH);
  doc.text('Total', ftX - 8, y + 11.5, { align: 'right' });

  const ftVal = (val, w) => {
    doc.text(val, ftX + w - 3, y + 11.5, { align: 'right' });
    ftX += w;
    drawVertLine(ftX, y, y + rowH);
  };

  ftVal(totalQty.toFixed(2), col.qty);
  ftX += col.rate; drawVertLine(ftX, y, y + rowH);
  ftVal(totalAmt.toFixed(2), col.amt);
  ftVal(totalDisc > 0 ? totalDisc.toFixed(2) : '', col.disc);
  ftVal(totalTaxable.toFixed(2), col.taxVal);
  ftX += col.igstRte; drawVertLine(ftX, y, y + rowH);
  ftVal(totalTaxAmt.toFixed(2), col.igstAmt);

  doc.text(finalNet.toFixed(2), margin + usableW - 3, y + 11.5, { align: 'right' });
  y += rowH;

  // === 6. TOTAL AMOUNT & SUMMARY SECTION === //
  const leftSummaryW = usableW * 0.55;
  const rightGrpW = usableW - leftSummaryW;
  const summaryH = 75; // 5 rows x 15

  // Left Amount words box
  doc.rect(margin, y, leftSummaryW, summaryH);
  // Right Totals bounds
  doc.rect(margin + leftSummaryW, y, rightGrpW, summaryH);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Invoice amount in words', margin + 5, y + 14);

  let netRounded = Math.round(bill.netAmount || finalNet);
  let amountStr = numberToWords(netRounded).toUpperCase() + ' RUPEES ONLY';
  doc.setFont('helvetica', 'normal');
  doc.text(amountStr, margin + 5, y + 28, { maxWidth: leftSummaryW - 10 });

  let ry = y;
  const ryRow = 15;
  const labelSplitX = margin + leftSummaryW + (rightGrpW * 0.6);
  drawVertLine(labelSplitX, ry, ry + summaryH);

  const drawSummaryLine = (label, val, isBold, isLast = false) => {
    if (isBold) doc.setFont('helvetica', 'bold'); else doc.setFont('helvetica', 'normal');
    doc.text(label, margin + leftSummaryW + 5, ry + 11);
    doc.text(val, margin + usableW - 4, ry + 11, { align: 'right' });
    if (!isLast) drawRowLine(ry + ryRow, margin + leftSummaryW, margin + usableW);
    ry += ryRow;
  };

  drawSummaryLine('Total Amount before Tax', totalTaxable.toFixed(2), true);
  drawSummaryLine(`Add: IGST @ ${items[0]?.taxRate || 5}%`, totalTaxAmt.toFixed(2), false);
  drawSummaryLine('Total Value', (totalTaxable + totalTaxAmt).toFixed(2), true);

  const otherCharges = (Number(bill.freightAmount) || 0) + (Number(bill.packingCharge) || 0);
  if (otherCharges > 0) {
    drawSummaryLine('Shipping Cost', otherCharges.toFixed(2), false);
  } else {
    drawSummaryLine('Rounding Off', Number(bill.roundOff || 0).toFixed(2), false);
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  // Need to manually draw the last line if we want spacing around it since the wrapper has no bottom margin logic explicitly matching
  doc.text('Total Amount After Tax', margin + leftSummaryW + 5, ry + 11);
  doc.text(netRounded.toFixed(2), margin + usableW - 4, ry + 11, { align: 'right' });

  y += summaryH + 8; // Small spacing before footer block

  // === 7. BANK / SEAL / SIGNATURE SECTION === //
  const botAreaH = 100;
  const bankW = usableW * 0.40;
  const sealW = usableW * 0.25;
  const certW = usableW * 0.35;

  doc.setFillColor(230, 230, 230);
  doc.rect(margin, y, usableW, 16, 'F'); // Fill header background only, no double borders
  doc.rect(margin, y, usableW, botAreaH, 'S'); // Outer border
  drawVertLine(margin + bankW, y, y + botAreaH);
  drawVertLine(margin + bankW + sealW, y, y + botAreaH);
  drawRowLine(y + 16, margin, margin + usableW);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Bank Details', margin + bankW / 2, y + 11.5, { align: 'center' });
  doc.text('Authorized Seal', margin + bankW + sealW / 2, y + 11.5, { align: 'center' });

  // Left: Bank Information
  doc.text('Bank A/C:', margin + 4, y + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(bankAccount, margin + 4, y + 42, { maxWidth: bankW - 8 });
  doc.setFont('helvetica', 'bold');
  doc.text('Bank IFSC:', margin + 4, y + 60);
  doc.setFont('helvetica', 'normal');
  doc.text(bankIFSC, margin + 4, y + 72);

  // Right: Certification & Signatory
  const certMidX = margin + bankW + sealW + certW / 2;
  doc.setFontSize(7);
  doc.text('Certified that the particulars given above', certMidX, y + 26, { align: 'center' });
  doc.text('are true and correct', certMidX, y + 36, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('For ' + companyName.toUpperCase() + ',', certMidX, y + 60, { align: 'center' });
  doc.text('AUTHORIZED SIGNATORY', certMidX, y + 90, { align: 'center' });

  y += botAreaH + 10;

  // Custom terms block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('Terms & Conditions:', margin, y);
  doc.setFont('helvetica', 'normal');
  const termLines = doc.splitTextToSize(termsText, usableW);
  doc.text(termLines, margin, y + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('THANKS FOR YOUR BUSINESS', pageWidth / 2, y + 45, { align: 'center' });

  // === FINAL EXPORT === //
  const fileName = `${bill.invoiceNo || 'invoice'}.pdf`;
  if (mode === 'print') {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else if (mode === 'view') {
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(fileName);
  }
};
