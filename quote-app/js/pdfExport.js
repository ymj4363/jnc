/**
 * pdfExport.js - PDF 생성 및 다운로드
 * 의존성: html2canvas 1.4.1, jsPDF 2.5.1 (CDN)
 */

const PdfExport = (() => {

  const MARGIN_MM        = 10;
  const A4_WIDTH_MM      = 210;
  const A4_HEIGHT_MM     = 297;
  const CONTENT_W_MM     = A4_WIDTH_MM  - MARGIN_MM * 2;  // 190mm
  const CONTENT_H_MM     = A4_HEIGHT_MM - MARGIN_MM * 2;  // 277mm
  const CONTENT_W_PX     = Math.round(CONTENT_W_MM * 96 / 25.4); // ~718px

  function sanitize(val, fallback) {
    return (val || fallback || '').replace(/[\\/:*?"<>|]/g, '_').trim();
  }

  function setBtn(loading) {
    const btn = document.getElementById('btnPdf');
    if (!btn) return;
    btn.disabled    = loading;
    btn.textContent = loading ? 'PDF 생성 중...' : 'PDF 저장';
  }

  /**
   * @param {string}  customerName
   * @param {string}  dateStr
   * @param {string}  quoteNo
   * @param {string}  [html]  - Preview.render() 결과 HTML 문자열
   */
  async function download(customerName, dateStr, quoteNo, html) {
    const name     = sanitize(customerName, '고객사');
    const no       = sanitize(quoteNo);
    const filename = no ? `견적서-${name}-${no}.pdf` : `견적서-${name}.pdf`;

    setBtn(true);

    /* ── 오프스크린 컨테이너 ─────────────────────────── */
    const wrap = document.createElement('div');
    wrap.style.cssText = [
      'position:fixed',
      `left:${-(CONTENT_W_PX + 100)}px`,
      'top:0',
      `width:${CONTENT_W_PX}px`,
      'background:#fff',
      'z-index:-1',
      'overflow:visible',
    ].join(';');

    if (html) {
      wrap.innerHTML = html;
    } else {
      const el = document.getElementById('quoteDocument');
      if (!el) {
        alert('미리보기를 먼저 생성해주세요.');
        setBtn(false);
        return;
      }
      wrap.appendChild(el.cloneNode(true));
    }

    document.body.appendChild(wrap);
    const target = wrap.firstElementChild;

    try {
      /* ── html2canvas 캡처 ────────────────────────── */
      const canvas = await html2canvas(target, {
        scale          : 2,
        useCORS        : true,
        logging        : false,
        backgroundColor: '#ffffff',
        scrollX        : 0,
        scrollY        : 0,
      });

      /* ── jsPDF 생성 ──────────────────────────────── */
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const imgData   = canvas.toDataURL('image/jpeg', 0.98);
      const totalHmm  = (canvas.height / canvas.width) * CONTENT_W_MM;

      if (totalHmm <= CONTENT_H_MM) {
        /* 단일 페이지 */
        pdf.addImage(imgData, 'JPEG', MARGIN_MM, MARGIN_MM, CONTENT_W_MM, totalHmm);
      } else {
        /* 다중 페이지: 캔버스를 잘라서 각 페이지에 배치 */
        const pageHpx = Math.round(CONTENT_H_MM * canvas.width / CONTENT_W_MM);
        let   offsetPx = 0;
        let   page     = 0;

        while (offsetPx < canvas.height) {
          const slicePx  = Math.min(pageHpx, canvas.height - offsetPx);
          const sliceHmm = (slicePx / canvas.height) * totalHmm;

          const pc  = document.createElement('canvas');
          pc.width  = canvas.width;
          pc.height = slicePx;
          pc.getContext('2d').drawImage(
            canvas, 0, offsetPx, canvas.width, slicePx,
            0, 0, canvas.width, slicePx
          );

          if (page > 0) pdf.addPage();
          pdf.addImage(pc.toDataURL('image/jpeg', 0.98), 'JPEG',
                       MARGIN_MM, MARGIN_MM, CONTENT_W_MM, sliceHmm);

          offsetPx += slicePx;
          page++;
        }
      }

      pdf.save(filename);

    } catch (err) {
      console.error('PDF 생성 오류:', err);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      document.body.removeChild(wrap);
      setBtn(false);
    }
  }

  return { download };
})();
