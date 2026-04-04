/**
 * calculator.js - 견적 금액 계산 모듈
 */

const Calculator = (() => {

  const VAT_RATE = 0.10;  // 부가세 10%

  function calculate(formData) {
    const items = [];
    let subtotal = 0;

    if (formData.btdf.enabled) {
      const item = calcItem('btdf', formData.btdf);
      subtotal += item.total;
      items.push(item);
    }

    if (formData.brdf.enabled) {
      const item = calcItem('brdf', formData.brdf);
      subtotal += item.total;
      items.push(item);
    }

    const discountRate   = formData.discountRate  || 0;
    const discountLabel  = formData.discountLabel || '';
    const discountAmount = Math.round(subtotal * discountRate);
    const grandTotal     = subtotal - discountAmount;

    // 부가세
    const vatOption  = formData.vatOption || 'exclusive';  // exclusive | inclusive
    const vatAmount  = vatOption === 'inclusive' ? Math.round(grandTotal * VAT_RATE) : 0;
    const finalTotal = grandTotal + vatAmount;

    return {
      items,
      subtotal,
      discountRate, discountLabel, discountAmount,
      grandTotal,
      vatOption, vatAmount, finalTotal,
    };
  }

  /** 단일 측정 항목 계산 (수량 반영) */
  function calcItem(type, data) {
    const cfg      = CONFIG.pricing[type];
    const qty      = data.qty || 1;

    // 기본 단가
    const basePrice = cfg.basePrice;

    // 입사각 추가 비용 (기본 3개 초과분)
    const baseAngleCnt  = CONFIG.pricing.incidentAngle.baseCount;
    const extraAngleCnt = Math.max(0, data.incidentAngles.length - baseAngleCnt);
    const angleCost     = extraAngleCnt * CONFIG.pricing.incidentAngle.additionalPrice;

    // azimuth 추가 비용 (기본 2개 초과분)
    const extraAzimuthCnt = data.extraAzimuth || 0;
    const azimuthCost     = extraAzimuthCnt * CONFIG.pricing.azimuth.additionalPrice;

    // 광원 추가 비용
    const lightCost = data.lightSource?.type === 'laser'
      ? CONFIG.pricing.lightSource.laser.additionalPrice
      : 0;

    // 1회(1개) 단가 합계
    const unitPrice = basePrice + angleCost + azimuthCost + lightCost;

    // 수량 적용
    const total = unitPrice * qty;

    return {
      type: type.toUpperCase(),
      label: cfg.label,
      basePrice,
      qty,
      unitPrice,
      incidentAngles:  data.incidentAngles,
      extraAngleCnt,
      angleCost,
      azimuthValues:   data.azimuthValues,
      extraAzimuthCnt,
      azimuthCost,
      thetaStep:       data.thetaStep,
      lightSource:     data.lightSource,
      lightCost,
      total,
    };
  }

  function formatKRW(amount) {
    return Number(amount).toLocaleString('ko-KR') + '원';
  }

  return { calculate, formatKRW, VAT_RATE };
})();
