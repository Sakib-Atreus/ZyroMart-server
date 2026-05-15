import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { IOrder } from './order.interface';

const money = (n: number, ccy: string) =>
  `${ccy} ${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

/**
 * Stream a PDF invoice for an order directly to the HTTP response.
 * Visible to the order owner, the admin, or the vendor (whose items have been
 * filtered upstream).
 */
export const streamInvoicePDF = (order: IOrder, res: Response): void => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="invoice-${order.orderNumber}.pdf"`,
  );
  doc.pipe(res);

  // --- Header
  doc
    .fontSize(22)
    .fillColor('#f97316')
    .text('ZyroMart', 50, 50)
    .fontSize(10)
    .fillColor('#6b7280')
    .text('E-commerce platform', 50, 75)
    .moveDown(0.5);

  doc
    .fontSize(20)
    .fillColor('#111827')
    .text('INVOICE', 400, 50, { align: 'right' });
  doc
    .fontSize(10)
    .fillColor('#374151')
    .text(`# ${order.orderNumber}`, 400, 75, { align: 'right' })
    .text(
      `Date: ${new Date(order.placedAt).toLocaleDateString()}`,
      400,
      90,
      { align: 'right' },
    )
    .text(`Status: ${order.status}`, 400, 105, { align: 'right' })
    .text(`Payment: ${order.paymentStatus}`, 400, 120, { align: 'right' });

  doc.moveTo(50, 150).lineTo(545, 150).strokeColor('#e5e7eb').stroke();

  // --- Ship to
  let y = 170;
  doc.fontSize(11).fillColor('#374151').text('BILL / SHIP TO', 50, y);
  y += 18;
  doc.fontSize(10).fillColor('#111827').text(order.shippingAddress.fullName, 50, y);
  y += 14;
  doc.fontSize(10).fillColor('#4b5563').text(order.shippingAddress.line1, 50, y);
  if (order.shippingAddress.line2) {
    y += 14;
    doc.text(order.shippingAddress.line2, 50, y);
  }
  y += 14;
  doc.text(
    `${order.shippingAddress.city}, ${order.shippingAddress.country}${
      order.shippingAddress.postalCode ? ` — ${order.shippingAddress.postalCode}` : ''
    }`,
    50,
    y,
  );
  y += 14;
  doc.text(`Phone: ${order.shippingAddress.phone}`, 50, y);

  y += 30;

  // --- Items table header
  const COLS = {
    item: { x: 50, w: 210 },
    sku: { x: 265, w: 90 },
    qty: { x: 360, w: 30 },
    unit: { x: 395, w: 60 },
    total: { x: 460, w: 85 },
  };

  doc
    .rect(50, y - 6, 495, 20)
    .fillColor('#f3f4f6')
    .fill();

  doc.fillColor('#111827').fontSize(10);
  doc.text('ITEM', COLS.item.x + 4, y, { width: COLS.item.w });
  doc.text('SKU', COLS.sku.x, y, { width: COLS.sku.w });
  doc.text('QTY', COLS.qty.x, y, { width: COLS.qty.w, align: 'right' });
  doc.text('UNIT', COLS.unit.x, y, { width: COLS.unit.w, align: 'right' });
  doc.text('TOTAL', COLS.total.x, y, { width: COLS.total.w, align: 'right' });

  y += 22;
  doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
  y += 6;

  // --- Rows
  doc.fontSize(10).fillColor('#111827');
  for (const item of order.items) {
    const optionsText = item.variantSnapshot?.options
      ? Object.entries(item.variantSnapshot.options as Record<string, string>)
          .map(([k, v]) => `${k}: ${v}`)
          .join(' · ')
      : '';

    const textTop = y;
    doc.fillColor('#111827').text(
      item.productSnapshot?.name ?? '',
      COLS.item.x + 4,
      textTop,
      { width: COLS.item.w },
    );

    if (optionsText) {
      doc
        .fontSize(8)
        .fillColor('#6b7280')
        .text(optionsText, COLS.item.x + 4, doc.y, { width: COLS.item.w })
        .fontSize(10)
        .fillColor('#111827');
    }

    const itemBottom = doc.y;
    doc.text(item.variantSnapshot?.sku ?? '', COLS.sku.x, textTop, {
      width: COLS.sku.w,
    });
    doc.text(String(item.quantity), COLS.qty.x, textTop, {
      width: COLS.qty.w,
      align: 'right',
    });
    doc.text(
      money(item.unitPrice, order.currency),
      COLS.unit.x,
      textTop,
      { width: COLS.unit.w, align: 'right' },
    );
    doc.text(
      money(item.subtotal, order.currency),
      COLS.total.x,
      textTop,
      { width: COLS.total.w, align: 'right' },
    );

    y = Math.max(itemBottom, textTop + 14) + 6;
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#f3f4f6').stroke();
    y += 6;
  }

  // --- Totals
  y += 10;
  const LABEL_X = 360;
  const VALUE_X = 460;
  const VALUE_W = 85;
  const labels: [string, number, boolean?][] = [
    ['Subtotal', order.subtotal],
    ['Shipping', order.shippingFee],
    ['Tax', order.tax],
    ...(order.discount > 0
      ? ([['Discount', -order.discount]] as [string, number][])
      : []),
    ['TOTAL', order.total, true],
  ];

  for (const [label, value, bold] of labels) {
    if (bold) {
      doc.moveTo(LABEL_X, y - 4).lineTo(545, y - 4).strokeColor('#111827').stroke();
      y += 4;
      doc.fontSize(12).fillColor('#f97316').font('Helvetica-Bold');
    } else {
      doc.fontSize(10).fillColor('#374151').font('Helvetica');
    }
    doc.text(label, LABEL_X, y, { width: 90, align: 'right' });
    doc.text(money(value, order.currency), VALUE_X, y, {
      width: VALUE_W,
      align: 'right',
    });
    y += bold ? 22 : 16;
  }

  // --- Footer
  doc
    .fontSize(9)
    .fillColor('#6b7280')
    .font('Helvetica')
    .text('Thank you for shopping with ZyroMart.', 50, 780, {
      align: 'center',
      width: 495,
    });

  doc.end();
};
