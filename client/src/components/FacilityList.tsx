import React from 'react';
import type { Facility, TypeMeta } from '../types';
import { MapPin, MapPinOff, ExternalLink, Calendar, Shield, Building2 } from 'lucide-react';

interface FacilityListProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (f: Facility) => void;
  onOpenDetail: (f: Facility) => void;
  isLoading: boolean;
  typeMapping?: Record<string, TypeMeta>;
}

export const FacilityList: React.FC<FacilityListProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  onOpenDetail,
  isLoading,
  typeMapping = {}
}) => {
  if (isLoading) {
    return (
      <div className="facility-list-container">
        <div className="list-loading-state">
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
        </div>
      </div>
    );
  }

  if (facilities.length === 0) {
    return (
      <div className="facility-list-container">
        <div className="empty-state-card">
          <Building2 size={40} className="empty-icon" />
          <h3 className="empty-title">조건에 맞는 시설물이 없습니다</h3>
          <p className="empty-desc">
            선택하신 지역 또는 시설물 유형에 해당하는 등록 데이터가 없습니다. 필터를 초기화하거나 검색어를 변경해보세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="facility-list-container">
      <div className="list-header">
        <h3 className="list-title">시설물 목록</h3>
        <span className="list-count-badge">총 {facilities.length}건</span>
      </div>

      <div className="facility-cards-scroll">
        {facilities.map((facility) => {
          const isSelected = selectedFacility?.id === facility.id;
          const hasCoords = facility.latitude != null && facility.longitude != null && facility.latitude !== 0 && facility.longitude !== 0;
          const typeName = typeMapping[facility.type]?.name || facility.typeName || '시설물';

          return (
            <article
              key={facility.id}
              className={`facility-card ${isSelected ? 'card-selected' : ''}`}
              onClick={() => onSelectFacility(facility)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectFacility(facility);
                }
              }}
              aria-label={`${facility.name} 시설물 상세 카드`}
            >
              <div className="facility-card-top">
                <div className="tag-group">
                  <span className="type-badge">{typeName}</span>
                  <span className={`sector-badge ${facility.sector === '공공' ? 'sector-pub' : 'sector-prv'}`}>
                    {facility.sector}
                  </span>
                  <span className="class-badge">
                    <Shield size={11} /> {facility.facilityClass}
                  </span>
                </div>

                {hasCoords ? (
                  <span className="coord-badge coord-ok" title="지도 위치 마커 연동됨">
                    <MapPin size={12} /> 좌표 확인
                  </span>
                ) : (
                  <span className="coord-badge coord-missing" title="정확한 위치 좌표 미확보 (임의 마커 미표시)">
                    <MapPinOff size={12} /> 위치 미제공
                  </span>
                )}
              </div>

              <h4 className="facility-name">{facility.name}</h4>

              <div className="facility-meta-row">
                <MapPin size={13} className="meta-icon text-slate-400" />
                <span className="facility-address">{facility.address}</span>
              </div>

              {facility.managementAgency && (
                <div className="facility-meta-row sub-row">
                  <Building2 size={13} className="meta-icon text-slate-400" />
                  <span className="facility-agency">{facility.managementAgency}</span>
                </div>
              )}

              {facility.completionYear && (
                <div className="facility-meta-row sub-row">
                  <Calendar size={13} className="meta-icon text-slate-400" />
                  <span className="facility-year">{facility.completionYear}년 준공</span>
                </div>
              )}

              <div className="facility-card-bottom">
                <span className="source-label">출처: {facility.source}</span>
                <button
                  type="button"
                  className="detail-view-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetail(facility);
                  }}
                  title="시설물 상세 제원 보기"
                >
                  <span>상세정보</span>
                  <ExternalLink size={13} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
