import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Order } from '../types';

export const generateInvoicePDF = (order: Order) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text('TAX INVOICE', 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Order Number: ${order.order_number}`, 14, 30);
  doc.text(`Date: ${order.created_at ? new Date(order.created_at).toLocaleString() : new Date().toLocaleString()}`, 14, 35);
  doc.text(`Status: ${order.order_status}`, 14, 40);

  // Customer Details
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Bill To:', 14, 55);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`${order.customer_name}`, 14, 62);
  doc.text(`${order.customer_phone}`, 14, 67);
  doc.text(`${order.delivery_address_text || ''}`, 14, 72);
  doc.text(`${order.zone_name || ''}`, 14, 77);

  // Items Table
  const tableColumn = ["Item Description", "Qty", "Price", "Total"];
  const tableRows: any[] = [];

  // Parse items safely
  let items = order.items || [];

  items.forEach((item: any) => {
    const itemData = [
      item.product_name || 'Product',
      item.quantity || 1,
      `Rs. ${item.unit_price || 0}`,
      `Rs. ${(item.unit_price || 0) * (item.quantity || 1)}`
    ];
    tableRows.push(itemData);
  });

  (doc as any).autoTable({
    startY: 90,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] }, // Emerald 500
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY || 90;
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text(`Subtotal: Rs. ${order.total_amount}`, 140, finalY + 15);
  doc.text(`Discount: Rs. 0`, 140, finalY + 22);
  doc.setFontSize(14);
  doc.text(`Total Amount: Rs. ${order.total_amount}`, 140, finalY + 32);

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Thank you for your business!', 14, 280);

  // Save the PDF
  doc.save(`Invoice_${order.order_number}.pdf`);
};
