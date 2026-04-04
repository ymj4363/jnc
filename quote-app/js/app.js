/**
 * app.js - 메인 진입점, 모듈 통합 및 이벤트 바인딩
 */

const App = (() => {

  /** 앱 초기화 */
  function init() {
    Form.init();
    updatePreview();

    // 미리보기 버튼
    document.getElementById('btnPreview')?.addEventListener('click', () => {
      const errors = Form.validate();
      if (errors.length > 0) {
        alert(errors.join('\n'));
        return;
      }
      updatePreview();
      showPreviewModal();
    });

    // 모달 닫기
    document.getElementById('btnCloseModal')?.addEventListener('click', closePreviewModal);
    document.getElementById('previewModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'previewModal') closePreviewModal();
    });

    // PDF 저장 버튼
    document.getElementById('btnPdf')?.addEventListener('click', () => {
      const formData = Form.collect();
      PdfExport.download(formData.customerName, formData.quoteDate);
    });

    // 인쇄 버튼
    document.getElementById('btnPrint')?.addEventListener('click', () => window.print());
  }

  /** 미리보기 HTML 업데이트 (실시간 금액 반영) */
  function updatePreview() {
    try {
      const formData = Form.collect();
      const result = Calculator.calculate(formData);

      // 사이드 금액 요약 업데이트
      renderSummary(result);

      // 미리보기 패널이 열려 있으면 함께 업데이트
      const previewContent = document.getElementById('previewContent');
      if (previewContent && previewContent.innerHTML.trim() !== '') {
        previewContent.innerHTML = Preview.render(formData, result);
      }
    } catch (e) {
      console.error('미리보기 업데이트 오류:', e);
    }
  }

  /** 우측 금액 요약 패널 업데이트 */
  function renderSummary(result) {
    const summaryEl = document.getElementById('priceSummary');
    if (!summaryEl) return;

    let html = '<table class="summary-table">';
    result.items.forEach(item => {
      html += `<tr>
        <td>${item.type}</td>
        <td class="text-right">${item.total.toLocaleString('ko-KR')}원</td>
      </tr>`;
    });

    if (result.items.length === 0) {
      html += `<tr><td colspan="2" class="text-center text-muted">측정 유형을 선택하세요</td></tr>`;
    }

    html += `<tr class="summary-divider"><td colspan="2"></td></tr>`;
    html += `<tr class="summary-subtotal">
      <td>소 계</td>
      <td class="text-right">${result.subtotal.toLocaleString('ko-KR')}원</td>
    </tr>`;

    if (result.discountAmount > 0) {
      html += `<tr class="summary-discount">
        <td>할인 (${Math.round(result.discountRate * 100)}%)</td>
        <td class="text-right text-red">- ${result.discountAmount.toLocaleString('ko-KR')}원</td>
      </tr>`;
    }

    if (result.vatOption === 'inclusive') {
      html += `<tr class="summary-subtotal">
        <td>공급가액</td>
        <td class="text-right">${result.grandTotal.toLocaleString('ko-KR')}원</td>
      </tr>`;
      html += `<tr class="summary-subtotal">
        <td>부가세 (10%)</td>
        <td class="text-right">${result.vatAmount.toLocaleString('ko-KR')}원</td>
      </tr>`;
      html += `<tr class="summary-total">
        <td><strong>최종 합계</strong></td>
        <td class="text-right"><strong>${result.finalTotal.toLocaleString('ko-KR')}원</strong></td>
      </tr>`;
      html += `<tr><td colspan="2" class="text-right" style="font-size:11px;color:#2a7a3e;padding-top:2px;">VAT 포함</td></tr>`;
    } else {
      html += `<tr class="summary-total">
        <td><strong>합 계</strong></td>
        <td class="text-right"><strong>${result.grandTotal.toLocaleString('ko-KR')}원</strong></td>
      </tr>`;
      html += `<tr><td colspan="2" class="text-right" style="font-size:11px;color:#888;padding-top:2px;">부가세 별도</td></tr>`;
    }

    html += '</table>';

    summaryEl.innerHTML = html;
  }

  /** 미리보기 모달 표시 */
  function showPreviewModal() {
    const formData = Form.collect();
    const result = Calculator.calculate(formData);
    const previewContent = document.getElementById('previewContent');
    if (previewContent) {
      previewContent.innerHTML = Preview.render(formData, result);
    }
    const modal = document.getElementById('previewModal');
    if (modal) modal.style.display = 'flex';
  }

  /** 미리보기 모달 닫기 */
  function closePreviewModal() {
    const modal = document.getElementById('previewModal');
    if (modal) modal.style.display = 'none';
  }

  return { init, updatePreview };
})();

// DOM 준비 후 초기화
document.addEventListener('DOMContentLoaded', App.init);
