import React from 'react';
import { Search, RotateCcw, Filter, MapPin, Building2 } from 'lucide-react';
import type { FacilityTypeKey, TypeMeta } from '../types';

export const SIDO_LIST = [
  '전체',
  '서울특별시',
  '경기도',
  '부산광역시',
  '인천광역시',
  '대구광역시',
  '대전광역시',
  '광주광역시',
  '울산광역시',
  '세종특별자치시',
  '강원특별자치도',
  '충청북도',
  '충청남도',
  '전북특별자치도',
  '전라남도',
  '경상북도',
  '경상남도',
  '제주특별자치도'
];

interface FilterBarProps {
  selectedSido: string;
  onSelectSido: (sido: string) => void;
  selectedType: string;
  onSelectType: (type: string) => void;
  selectedSector: string;
  onSelectSector: (sector: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onReset: () => void;
  typeMapping?: Record<string, TypeMeta>;
  totalCount: number;
  withCoordinatesCount: number;
  missingCoordinatesCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedSido,
  onSelectSido,
  selectedType,
  onSelectType,
  selectedSector,
  onSelectSector,
  searchQuery,
  onSearchChange,
  onReset,
  typeMapping = {},
  totalCount,
  withCoordinatesCount,
  missingCoordinatesCount
}) => {
  return (
    <nav className="filter-bar-container" aria-label="시설물 검색 및 필터 옵션">
      <div className="filter-controls-row">
        {/* 1. 지역 (시·도) 선택 */}
        <div className="filter-group">
          <label htmlFor="sido-select" className="filter-label">
            <MapPin size={14} className="filter-icon" />
            <span>지역 선택</span>
          </label>
          <select
            id="sido-select"
            className="filter-select"
            value={selectedSido}
            onChange={(e) => onSelectSido(e.target.value)}
          >
            {SIDO_LIST.map((sido) => (
              <option key={sido} value={sido}>
                {sido === '전체' ? '전국 전체' : sido}
              </option>
            ))}
          </select>
        </div>

        {/* 2. 시설물 유형 선택 */}
        <div className="filter-group">
          <label htmlFor="type-select" className="filter-label">
            <Filter size={14} className="filter-icon" />
            <span>시설물 유형</span>
          </label>
          <select
            id="type-select"
            className="filter-select"
            value={selectedType}
            onChange={(e) => onSelectType(e.target.value)}
          >
            <option value="전체">전체 유형</option>
            {Object.entries(typeMapping).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.name} ({meta.category})
              </option>
            ))}
          </select>
        </div>

        {/* 3. 부문 (공공/민간) 선택 */}
        <div className="filter-group">
          <label htmlFor="sector-select" className="filter-label">
            <Building2 size={14} className="filter-icon" />
            <span>부문 구분</span>
          </label>
          <select
            id="sector-select"
            className="filter-select"
            value={selectedSector}
            onChange={(e) => onSelectSector(e.target.value)}
          >
            <option value="전체">전체 부문</option>
            <option value="공공">공공시설물</option>
            <option value="민간">민간시설물</option>
          </select>
        </div>

        {/* 4. 시설물명 및 주소 검색 */}
        <div className="filter-group search-group">
          <label htmlFor="search-input" className="filter-label">
            <Search size={14} className="filter-icon" />
            <span>시설물명/주소 검색</span>
          </label>
          <div className="search-input-wrapper">
            <input
              id="search-input"
              type="text"
              className="search-input"
              placeholder="예: 마포대교, 남산터널, 종로구..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => onSearchChange('')}
                title="검색어 지우기"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* 5. 초기화 버튼 */}
        <button 
          type="button" 
          className="reset-btn" 
          onClick={onReset}
          title="모든 필터 초기화"
        >
          <RotateCcw size={14} />
          <span>초기화</span>
        </button>
      </div>

      {/* 결과 요약 바 */}
      <div className="filter-result-summary">
        <div className="result-counts">
          <span className="count-badge total-badge">
            검색 결과: <strong>{totalCount}</strong>건
          </span>
          <span className="count-badge map-badge">
            지도 마커 표시: <strong>{withCoordinatesCount}</strong>건
          </span>
          {missingCoordinatesCount > 0 && (
            <span className="count-badge unlocated-badge" title="상세 주소 또는 좌표 데이터 미확보로 지도 마커 제외">
              위치 미제공: <strong>{missingCoordinatesCount}</strong>건
            </span>
          )}
        </div>

        <div className="active-filter-tags">
          {selectedSido !== '전체' && (
            <span className="filter-tag">지역: {selectedSido}</span>
          )}
          {selectedType !== '전체' && (
            <span className="filter-tag">유형: {typeMapping[selectedType as FacilityTypeKey]?.name || selectedType}</span>
          )}
          {selectedSector !== '전체' && (
            <span className="filter-tag">부문: {selectedSector}</span>
          )}
          {searchQuery && (
            <span className="filter-tag">검색: "{searchQuery}"</span>
          )}
        </div>
      </div>
    </nav>
  );
};
