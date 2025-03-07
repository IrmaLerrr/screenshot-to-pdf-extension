document.addEventListener('DOMContentLoaded', () => {
  const { jsPDF } = window.jspdf;
  const reportNameInput = document.getElementById('report-name');
  const startReportButton = document.getElementById('start-report');
  const takeScreenshotButton = document.getElementById('take-screenshot');
  const finishReportButton = document.getElementById('finish-report');

  let reportName = '';
  let screenshots = [];

  // Загрузка состояния при открытии popup
  chrome.storage.local.get(['reportName', 'screenshots'], (result) => {
    reportName = result.reportName || '';
    screenshots = result.screenshots || [];

    // Восстановление состояния
    reportNameInput.value = reportName;
    updateButtonsState();
  });

  // Обновление состояния кнопок
  function updateButtonsState() {
    takeScreenshotButton.disabled = !reportName;
    finishReportButton.disabled = screenshots.length === 0;
  }

  // Начало формирования отчета
  startReportButton.addEventListener('click', () => {
    reportName = reportNameInput.value.trim();
    if (!reportName) {
      alert('Введите название отчета.');
      return;
    }

    screenshots = [];
    chrome.storage.local.set({ reportName, screenshots }, () => {
      updateButtonsState();
      alert('Начато формирование отчета. Используйте Ctrl+Shift+Z для создания скриншотов.');
    });
  });

  // Создание скриншота через кнопку
  takeScreenshotButton.addEventListener('click', () => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      screenshots.push(dataUrl);
      chrome.storage.local.set({ screenshots }, () => {
        updateButtonsState();
        // alert('Скриншот сохранен.');
      });
    });
  });

  // Создание скриншота через горячую клавишу
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.screenshots) {
      screenshots = changes.screenshots.newValue || [];
      updateButtonsState();
      // alert('Скриншот сохранен.');
    }
  });

  // Завершение формирования отчета
  finishReportButton.addEventListener('click', () => {
    if (screenshots.length === 0) {
      alert('Нет скриншотов для создания отчета.');
      return;
    }

    // Создание PDF
    const pdf = new jsPDF();
    screenshots.forEach((dataUrl, index) => {
      if (index !== 0) pdf.addPage();
      pdf.addImage(dataUrl, 'PNG', 10, 10, 190, 0);
    });

    // Создание архива
    const zip = new JSZip();
    const pdfBlob = pdf.output('blob');
    zip.file(`${reportName}.pdf`, pdfBlob);

    screenshots.forEach((dataUrl, index) => {
      const imgBlob = dataURLtoBlob(dataUrl);
      zip.file(`screenshot_${index + 1}.png`, imgBlob);
    });

    zip.generateAsync({ type: 'blob' }).then((content) => {
      const url = URL.createObjectURL(content);
      chrome.downloads.download({
        url: url,
        filename: `${reportName}.zip`
      }, () => {
        chrome.storage.local.set({ reportName: '', screenshots: [] }, () => {
          alert('Отчет успешно создан и загружен.');
          updateButtonsState();
        });
      });
    });
  });

  // Преобразование Data URL в Blob
  function dataURLtoBlob(dataUrl) {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }
});