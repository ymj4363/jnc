/**
 * pdfExport.js - PDF 생성 및 다운로드 모듈
 * 라이브러리: html2pdf.js (CDN)
 */

const PdfExport = (() => {

  /**
   * 현재 미리보기 영역을 PDF로 저장
   * @param {string} customerName - 파일명에 사용할 고객사명
   * @param {string} dateStr      - 날짜 문자열 (YYYY-MM-DD)
   * @param {string} quoteNo      - 견적 번호
   * @param {string} [html]       - 직접 전달할 HTML (없으면 #quoteDocument 사용)
   */
  function download(customerName, dateStr, quoteNo, html) {
    const safeName   = (customerName || '고객사').replace(/[\\/:*?"<>|]/g, '_');
    const safeQuoteNo = (quoteNo || '').replace(/[\\/:*?"<>|]/g, '_');
    const filename   = `견적서-${safeName}-${safeQuoteNo}.pdf`;

    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },
    };

    // 버튼 로딩 상태
    const btn = document.getElementById('btnPdf');
    if (btn) { btn.disabled = true; btn.textContent = 'PDF 생성 중...'; }

    const restore = () => {
      if (btn) { btn.disabled = false; btn.textContent = 'PDF 저장'; }
    };

    if (html) {
      // HTML 문자열을 html2pdf에 직접 전달 — 라이브러리가 내부적으로 임시 DOM 처리
      html2pdf().set(opt).from(html).save().then(restore).catch(err => {
        console.error('PDF 생성 오류:', err);
        alert('PDF 생성 중 오류가 발생했습니다.');
        restore();
      });
    } else {
      // 미리보기 모달이 열린 상태에서 호출 (모달 내 PDF 버튼)
      const element = document.getElementById('quoteDocument');
      if (!element) { alert('미리보기를 먼저 생성해주세요.'); restore(); return; }
      html2pdf().set(opt).from(element).save().then(restore).catch(err => {
        console.error('PDF 생성 오류:', err);
        alert('PDF 생성 중 오류가 발생했습니다.');
        restore();
      });
    }
  }

  return { download };
})();
