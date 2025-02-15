document.getElementById('start-report').addEventListener('click', () => {
    chrome.storage.local.set({ screenshots: [] }, () => {
      alert('Начато формирование отчета. Скриншоты будут сохранены.');
    });
  });
  
  document.getElementById('take-screenshot').addEventListener('click', () => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      chrome.storage.local.get(['screenshots'], (result) => {
        const screenshots = result.screenshots || [];
        screenshots.push(dataUrl);
        chrome.storage.local.set({ screenshots }, () => {
          alert('Скриншот сохранен.');
        });
      });
    });
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    // Проверка, что библиотека загружена
    if (typeof window.jspdf === 'undefined') {
      console.error('Ошибка: Библиотека jsPDF не загружена.');
      alert('Ошибка: Библиотека jsPDF не загружена.');
      return;
    }
  
    const { jsPDF } = window.jspdf; // Доступ к jsPDF из UMD-версии
  
    // Ваш код
    document.getElementById('finish-report').addEventListener('click', () => {
      chrome.storage.local.get(['screenshots'], (result) => {
        const screenshots = result.screenshots || [];
        if (screenshots.length === 0) {
          alert('Нет скриншотов для создания отчета.');
          return;
        }
  
        const pdf = new jsPDF();
        screenshots.forEach((dataUrl, index) => {
          if (index !== 0) pdf.addPage();
          pdf.addImage(dataUrl, 'PNG', 10, 10, 190, 0);
        });
  
        const pdfBlob = pdf.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        chrome.downloads.download({
          url: url,
          filename: 'report.pdf'
        }, () => {
          chrome.storage.local.set({ screenshots: [] }, () => {
            alert('Отчет успешно создан и загружен.');
          });
        });
      });
    });
  });