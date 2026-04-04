/**
 * config.js - 견적서 가격 설정 및 옵션 목록
 * 단가 변경 시 이 파일만 수정하면 됩니다.
 */

const CONFIG = {
  // 회사 정보
  company: {
    name: 'J & C TECH',
    fullName: 'J&C Technology Co.,Ltd.',
    bank: '국민은행 179-026653-04-019',
    validity: '30days',
    paymentTerms: '50% Cash in Advance, 50% Cash upon Delivery.',
  },

  // 측정 서비스 기본 단가
  pricing: {
    btdf: {
      label: 'BSDF (BTDF) : 투과 측정',
      basePrice: 1800000,
    },
    brdf: {
      label: 'BSDF (BRDF) : 반사 측정',
      basePrice: 1800000,
    },

    // 입사각 기본 포함 개수
    incidentAngle: {
      baseCount: 3,
      defaultAngles: [0, 30, 60],
      additionalPrice: 600000,   // 추가 입사각 1개당 단가
    },

    // 측정각 phi (azimuth) 기본 포함 수
    azimuth: {
      baseValues: [0, 90],
      additionalPrice: 600000,   // 추가 azimuth(phi) 1개당 단가
    },

    // 광원 옵션
    lightSource: {
      halogen: {
        label: '할로겐 (Halogen)',
        additionalPrice: 0,
      },
      laser: {
        label: '레이저 (Laser)',
        additionalPrice: 0,
        wavelengths: [
          { label: '405 nm', value: '405' },
          { label: '530 nm', value: '530' },
          { label: '645 nm', value: '645' },
        ],
      },
    },

    // 할인
    discount: {
      rate: 0,
      label: '',
    },
  },

  // 측정각 theta 기본 설정
  theta: {
    min: -80,
    max: 80,
    defaultStep: 10,    // 기본 간격 10°
    minStep: 0.1,       // 최소 간격 0.1°
    label: '-80° ~ 80°',
  },

  // 샘플 사이즈 제한
  sampleSize: {
    min: 30,   // mm
    max: 200,  // mm
  },
};
