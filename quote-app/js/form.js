/**
 * form.js - 폼 동적 처리 및 데이터 수집 모듈
 */

const Form = (() => {

  /** 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
  function getTodayString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * 날짜 문자열(YYYY-MM-DD) → 견적번호 접두사(YYMMDD)
   * 예) 2026-04-03 → 260403
   */
  function dateToPrefix(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return '';
    const yy = parts[0].slice(-2);
    return `${yy}${parts[1]}${parts[2]}`;
  }

  /** 폼 초기화 - 날짜 자동 입력, 이벤트 바인딩 */
  function init() {
    // 작성일 자동 입력
    const dateEl = document.getElementById('quoteDate');
    if (dateEl) {
      dateEl.value = getTodayString();
      // 날짜 변경 시 접두사 자동 갱신 (일련번호는 유지)
      dateEl.addEventListener('change', () => {
        const prefixEl = document.getElementById('quoteNoPrefix');
        if (prefixEl) prefixEl.value = dateToPrefix(dateEl.value);
        App.updatePreview();
      });
      // 초기 접두사 설정
      const prefixEl = document.getElementById('quoteNoPrefix');
      if (prefixEl) prefixEl.value = dateToPrefix(dateEl.value);
    }
    // 일련번호 변경 시 미리보기 갱신
    document.getElementById('quoteNoSeq')?.addEventListener('input', App.updatePreview);

    // BTDF/BRDF 체크박스 토글
    bindMeasurementToggle('btdf');
    bindMeasurementToggle('brdf');

    // 입사각 추가 버튼
    document.getElementById('btdf-add-angle')?.addEventListener('click', () => addAngleRow('btdf'));
    document.getElementById('brdf-add-angle')?.addEventListener('click', () => addAngleRow('brdf'));

    // azimuth 추가 버튼
    document.getElementById('btdf-add-azimuth')?.addEventListener('click', () => addAzimuthRow('btdf'));
    document.getElementById('brdf-add-azimuth')?.addEventListener('click', () => addAzimuthRow('brdf'));

    // 광원 선택 이벤트
    bindLightSourceToggle('btdf');
    bindLightSourceToggle('brdf');

    // 실시간 금액 업데이트
    document.querySelectorAll('#quoteForm input, #quoteForm select, #quoteForm textarea')
      .forEach(el => el.addEventListener('change', App.updatePreview));
    document.querySelectorAll('#quoteForm input[type="number"]')
      .forEach(el => el.addEventListener('input', App.updatePreview));
  }

  /** 측정 유형 활성화/비활성화 토글 */
  function bindMeasurementToggle(type) {
    const checkbox = document.getElementById(`${type}-enabled`);
    const section = document.getElementById(`${type}-section`);
    if (!checkbox || !section) return;
    checkbox.addEventListener('change', () => {
      section.style.display = checkbox.checked ? 'block' : 'none';
      App.updatePreview();
    });
    section.style.display = checkbox.checked ? 'block' : 'none';
  }

  /** 광원 선택에 따라 레이저 파장대 표시/숨김 */
  function bindLightSourceToggle(type) {
    document.querySelectorAll(`input[name="${type}-lightSource"]`).forEach(radio => {
      radio.addEventListener('change', () => {
        const laserOpts = document.getElementById(`${type}-laser-options`);
        if (laserOpts) laserOpts.style.display = radio.value === 'laser' ? 'flex' : 'none';
        App.updatePreview();
      });
    });
  }

  /** 입사각 행 추가 */
  function addAngleRow(type) {
    const container = document.getElementById(`${type}-angles-container`);
    const row = document.createElement('div');
    row.className = 'extra-row';
    row.innerHTML = `
      <span class="extra-row-label">추가 입사각</span>
      <input type="number" class="angle-input" placeholder="각도 (°)" min="0" max="85" step="1">
      <span class="unit-label">°</span>
      <button type="button" class="btn-remove" onclick="Form.removeRow(this)">✕</button>
    `;
    container.appendChild(row);
    row.querySelector('input').addEventListener('input', App.updatePreview);
    App.updatePreview();
  }

  /** azimuth(phi) 행 추가 */
  function addAzimuthRow(type) {
    const container = document.getElementById(`${type}-azimuth-container`);
    const row = document.createElement('div');
    row.className = 'extra-row';
    row.innerHTML = `
      <span class="extra-row-label">추가 phi</span>
      <input type="number" class="azimuth-input" placeholder="각도 (°)" min="0" max="360" step="45">
      <span class="unit-label">°</span>
      <button type="button" class="btn-remove" onclick="Form.removeRow(this)">✕</button>
    `;
    container.appendChild(row);
    row.querySelector('input').addEventListener('input', App.updatePreview);
    App.updatePreview();
  }

  /** 행 삭제 */
  function removeRow(btn) {
    btn.closest('.extra-row').remove();
    App.updatePreview();
  }

  /** 레이저 파장대 선택 변경 처리 */
  function handleWavelengthChange(el, type) {
    App.updatePreview();
  }

  /**
   * 폼에서 현재 입력값을 수집하여 객체로 반환
   */
  function collect() {
    const dateVal = document.getElementById('quoteDate')?.value || getTodayString();
    return {
      customerName:    document.getElementById('customerName')?.value?.trim() || '',
      customerContact: document.getElementById('customerContact')?.value?.trim() || '',
      quoteDate:       dateVal,
      quoteNo:         buildQuoteNo(),
      remarks:         document.getElementById('remarks')?.value?.trim() || '',
      discountRate:    parseFloat(document.getElementById('discountRate')?.value || '0') / 100,
      discountLabel:   document.getElementById('discountLabel')?.value?.trim() || '',
      vatOption:       document.querySelector('input[name="vatOption"]:checked')?.value || 'exclusive',
      btdf:            collectMeasurement('btdf'),
      brdf:            collectMeasurement('brdf'),
    };
  }

  /** 단일 측정 유형 데이터 수집 */
  function collectMeasurement(type) {
    const enabled = document.getElementById(`${type}-enabled`)?.checked || false;
    if (!enabled) return { enabled: false };

    // 수량 (샘플 수 / 측정 횟수)
    const qty = Math.max(1, parseInt(document.getElementById(`${type}-qty`)?.value || '1', 10));

    // 기본 입사각 (유저가 직접 설정한 3개)
    const baseAngles = Array.from(
      document.querySelectorAll(`.${type}-base-angle`)
    ).map(el => parseFloat(el.value)).filter(v => !isNaN(v));
    // 추가 입사각
    const extraAngles = Array.from(
      document.querySelectorAll(`#${type}-angles-container .angle-input`)
    ).map(el => parseFloat(el.value)).filter(v => !isNaN(v));
    const incidentAngles = [...baseAngles, ...extraAngles];

    // 기본 azimuth (유저가 직접 설정한 2개)
    const baseAzimuth = Array.from(
      document.querySelectorAll(`.${type}-base-azimuth`)
    ).map(el => parseFloat(el.value)).filter(v => !isNaN(v));
    // 추가 azimuth
    const extraAzimuthVals = Array.from(
      document.querySelectorAll(`#${type}-azimuth-container .azimuth-input`)
    ).map(el => parseFloat(el.value)).filter(v => !isNaN(v));
    const azimuthValues = [...baseAzimuth, ...extraAzimuthVals];

    // theta 간격
    const thetaStepEl = document.getElementById(`${type}-theta-step`);
    const thetaStep = thetaStepEl
      ? Math.max(CONFIG.theta.minStep, parseFloat(thetaStepEl.value) || CONFIG.theta.defaultStep)
      : CONFIG.theta.defaultStep;

    // 광원
    const lightRadio = document.querySelector(`input[name="${type}-lightSource"]:checked`);
    const lightType = lightRadio?.value || 'halogen';
    let wavelength = null;
    if (lightType === 'laser') {
      wavelength = document.getElementById(`${type}-wavelength`)?.value || '';
    }

    return {
      enabled,
      qty,
      incidentAngles,
      extraAngleCount: extraAngles.length,
      azimuthValues,
      extraAzimuth: extraAzimuthVals.length,
      thetaStep,
      lightSource: { type: lightType, wavelength },
    };
  }

  /** 견적번호 조합: 접두사 + 일련번호 3자리 */
  function buildQuoteNo() {
    const prefix = document.getElementById('quoteNoPrefix')?.value || '';
    const seq    = String(parseInt(document.getElementById('quoteNoSeq')?.value || '1', 10)).padStart(3, '0');
    return prefix ? `${prefix}-${seq}` : seq;
  }

  /** 유효성 검사 */
  function validate() {
    const data = collect();
    const errors = [];
    if (!data.customerName)    errors.push('고객사명을 입력해주세요.');
    if (!data.customerContact) errors.push('담당자명을 입력해주세요.');
    if (!data.btdf.enabled && !data.brdf.enabled)
      errors.push('BTDF 또는 BRDF 중 하나 이상을 선택해주세요.');
    return errors;
  }

  return { init, collect, validate, removeRow, handleWavelengthChange };
})();
