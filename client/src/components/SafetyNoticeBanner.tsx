import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

export const SafetyNoticeBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside className="safety-notice-banner" aria-label="데이터 신뢰성 및 안전정보 원칙 안내">
      <div className="banner-summary">
        <div className="banner-left">
          <ShieldAlert className="banner-icon" size={18} />
          <p className="banner-text">
            <strong>공공데이터 기반 안내:</strong> 본 서비스는 국토안전관리원의 공공시설물 등록 통계 및 위치 정보를 제공하며,
            공식 검증되지 않은 임의의 '안전등급'이나 '위험점수'는 일절 생성하지 않습니다.
          </p>
        </div>
        <button 
          className="banner-toggle-btn"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {expanded ? '상세 기준 닫기' : '운영 원칙 확인'}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div className="banner-details">
          <ul className="banner-list">
            <li>
              <strong>통계 데이터와 위치 정보의 구분:</strong> 국토안전관리원 시설물 통계 API는 지역별·부문별 총괄 통계를 제공하며,
              개별 시설물 위치는 검증된 등록 좌표가 있는 시설물에 한해 지도에 표기됩니다.
            </li>
            <li>
              <strong>임의 안전도 판정 배제:</strong> 시설물 색상이나 마커는 위험도(적색/녹색 등)를 나타내지 않으며, 시설물 유형 및 분류 구분에만 사용됩니다.
            </li>
            <li>
              <strong>좌표 미제공 시설물 보호:</strong> 정확한 위·경도가 확보되지 않은 시설물은 임의 위치에 마커를 찍지 않고, 목록 내 '위치 미제공'으로 안내합니다.
            </li>
          </ul>
        </div>
      )}
    </aside>
  );
};
