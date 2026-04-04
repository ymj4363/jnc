/**
 * preview.js - 견적서 미리보기 HTML 렌더링 모듈
 */

const Preview = (() => {

  function render(formData, result) {
    const dateFormatted = formData.quoteDate
      ? formData.quoteDate.replace(/-/g, '.')
      : new Date().toLocaleDateString('ko-KR');
    const quoteNo = formData.quoteNo || '';

    return `
<div class="quote-document" id="quoteDocument">

  <!-- 헤더 -->
  <div class="quote-header">
    <div class="company-name">${CONFIG.company.name}</div>
    <table class="meta-table">
      <tr><th>Quotation No.</th><td>${esc(quoteNo)}</td></tr>
      <tr><th>Date</th><td>${esc(dateFormatted)}</td></tr>
      <tr><th>Validity</th><td>${CONFIG.company.validity}</td></tr>
    </table>
  </div>

  <div class="quote-title">QUOTATION</div>

  <!-- 수신처 -->
  <table class="to-table">
    <tr>
      <th>TO (고객사)</th>
      <td>${esc(formData.customerName) || '&nbsp;'}</td>
      <th>담당자</th>
      <td>${esc(formData.customerContact) || '&nbsp;'}</td>
    </tr>
  </table>
  <p class="quote-intro">
    We are pleased to offer you the under-mentioned goods on the terms and conditions described as follows ;<br>
    Should you require additional information or assistance, please do not hesitate to call.
  </p>

  <!-- 견적 내용 테이블 -->
  <table class="quote-table">
    <thead>
      <tr>
        <th class="col-desc">Description</th>
        <th class="col-qty">Q'ty</th>
        <th class="col-unit">단위</th>
        <th class="col-price">UNIT PRICE</th>
        <th class="col-total">TOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${result.items.map(item => renderItem(item)).join('')}
    </tbody>
    <tfoot>
      <tr class="row-subtotal">
        <td colspan="4" class="text-right"><strong>소 계</strong></td>
        <td class="text-right"><strong>${krw(result.subtotal)}</strong></td>
      </tr>
      ${result.discountAmount > 0 ? `
      <tr class="row-discount">
        <td colspan="4" class="text-right">
          ${esc(result.discountLabel) || 'Discount'} (${Math.round(result.discountRate * 100)}%)
        </td>
        <td class="text-right text-red">- ${krw(result.discountAmount)}</td>
      </tr>` : ''}
      <tr class="row-total">
        <td colspan="4" class="text-right">
          <strong>${result.vatOption === 'inclusive' ? '공급가액' : 'Total Amount (합계)'}</strong>
        </td>
        <td class="text-right total-amount"><strong>${krw(result.grandTotal)}</strong></td>
      </tr>
      ${result.vatOption === 'inclusive' ? `
      <tr class="row-vat">
        <td colspan="4" class="text-right">부가세 (VAT 10%)</td>
        <td class="text-right">${krw(result.vatAmount)}</td>
      </tr>
      <tr class="row-final">
        <td colspan="4" class="text-right"><strong>최종 합계 (VAT 포함)</strong></td>
        <td class="text-right final-amount"><strong>${krw(result.finalTotal)}</strong></td>
      </tr>` : `
      <tr class="row-vat-note">
        <td colspan="5" class="text-right vat-note">* 부가세 별도</td>
      </tr>`}
    </tfoot>
  </table>

  <!-- 하단 -->
  <div class="quote-footer">
    <table class="footer-table">
      <tr><th>Delivery</th><td>TBD</td></tr>
      <tr><th>Payment Terms</th><td>${CONFIG.company.paymentTerms}</td></tr>
      <tr><th>Advising Bank</th><td>${CONFIG.company.bank}</td></tr>
      <tr><th>Manufacturer</th><td>${CONFIG.company.fullName}</td></tr>
      ${formData.remarks ? `<tr><th>Remarks</th><td>${esc(formData.remarks)}</td></tr>` : ''}
    </table>
  </div>

</div>`;
  }

  /** 항목 1건 */
  function renderItem(item) {
    const angleList   = item.incidentAngles.map(a => a + '°').join(', ');
    const azimuthList = item.azimuthValues.map(a => a + '°').join(', ');
    const thetaDesc   = `-80° ~ 80°, ${item.thetaStep}° 간격`;
    const lightLabel  = item.lightSource?.type === 'laser'
      ? `레이저 (${item.lightSource.wavelength} nm)`
      : '할로겐';

    const extraRows = [];

    if (item.angleCost > 0) {
      extraRows.push(`
      <tr class="row-extra">
        <td class="desc-indent">추가 입사각 ${item.extraAngleCnt}개 × ${krw(CONFIG.pricing.incidentAngle.additionalPrice)}</td>
        <td></td><td></td>
        <td class="text-right">${krw(item.angleCost)}</td>
        <td></td>
      </tr>`);
    }

    if (item.azimuthCost > 0) {
      extraRows.push(`
      <tr class="row-extra">
        <td class="desc-indent">추가 phi(Azimuth) ${item.extraAzimuthCnt}개 × ${krw(CONFIG.pricing.azimuth.additionalPrice)}</td>
        <td></td><td></td>
        <td class="text-right">${krw(item.azimuthCost)}</td>
        <td></td>
      </tr>`);
    }

    if (item.lightCost > 0) {
      extraRows.push(`
      <tr class="row-extra">
        <td class="desc-indent">레이저 광원 추가 비용</td>
        <td></td><td></td>
        <td class="text-right">${krw(item.lightCost)}</td>
        <td></td>
      </tr>`);
    }

    return `
    <tr>
      <td>
        <strong>${esc(item.label)}</strong>
        <span class="desc-detail">- 샘플 수 / 측정 횟수 : ${item.qty}개</span>
        <span class="desc-detail">- 입사각 : ${esc(angleList)}</span>
        <span class="desc-detail">- 측정각 theta : ${esc(thetaDesc)}</span>
        <span class="desc-detail">- 측정각 phi (azimuth) : ${esc(azimuthList)}</span>
        <span class="desc-detail">- 광원 : ${esc(lightLabel)}</span>
        <span class="desc-detail">- 샘플 사이즈 : ${CONFIG.sampleSize.min} mm ~ ${CONFIG.sampleSize.max} mm</span>
      </td>
      <td class="text-center">${item.qty}</td>
      <td class="text-center">개</td>
      <td class="text-right">${krw(item.unitPrice)}</td>
      <td class="text-right">${krw(item.total)}</td>
    </tr>
    ${extraRows.join('')}`;
  }

  function esc(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function krw(amount) {
    return Number(amount).toLocaleString('ko-KR') + '원';
  }

  return { render };
})();
