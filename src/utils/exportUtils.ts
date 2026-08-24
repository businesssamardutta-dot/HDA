// Export Utilities for CSV, Excel-compatible format, and Print

export function exportToCSV(filename: string, rows: Record<string, any>[], headers?: { key: string; label: string }[]) {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const columns = headers || Object.keys(rows[0]).map(key => ({ key, label: key.toUpperCase().replace(/_/g, ' ') }));
  
  const csvHeader = columns.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const csvRows = rows.map(row => {
    return columns.map(col => {
      let val = row[col.key];
      if (val === null || val === undefined) val = '';
      else if (typeof val === 'object') val = JSON.stringify(val);
      else val = String(val);
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = [csvHeader, ...csvRows].join('\r\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(filename: string, rows: Record<string, any>[], headers?: { key: string; label: string }[]) {
  if (!rows || rows.length === 0) {
    alert('No data available to export.');
    return;
  }

  const columns = headers || Object.keys(rows[0]).map(key => ({ key, label: key.toUpperCase().replace(/_/g, ' ') }));

  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
    <style>
      th { background-color: #15803d; color: #ffffff; font-weight: bold; padding: 8px; border: 1px solid #e2e8f0; }
      td { padding: 6px 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px; }
      .header-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #166534; }
    </style>
  </head>
  <body>
    <div class="header-title">Haribansho Delivery Report: ${filename} (Generated on ${new Date().toLocaleString()})</div>
    <table>
      <thead>
        <tr>${columns.map(c => `<th>${c.label}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map(r => `<tr>${columns.map(c => {
          let val = r[c.key];
          if (val === null || val === undefined) val = '-';
          else if (typeof val === 'number') val = val.toLocaleString('en-IN');
          else if (typeof val === 'object') val = JSON.stringify(val);
          return `<td>${String(val)}</td>`;
        }).join('')}</tr>`).join('')}
      </tbody>
    </table>
  </body>
  </html>`;

  const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printReport(title: string, contentElementId?: string) {
  window.print();
}
