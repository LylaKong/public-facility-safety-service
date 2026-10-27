import React from 'react';
import type { Facility, TypeMeta } from '../types';
import { X, ShieldCheck, MapPin, Calendar, Database, ShieldAlert, CheckCircle } from 'lucide-react';

interface FacilityDetailModalProps {
  facility: Facility | null;
  onClose: () => void;
  typeMapping?: Record<string, TypeMeta>;
}

export const FacilityDetailModal: React.FC<FacilityDetailModalProps> = ({
  facility,
  onClose,
  typeMapping = {}
}) => {
  if (!facility) return null;

  const typeName = typeMapping[facility.type]?.name || facility.typeName || '시설물';
  const hasCoords = facility.latitude != null && facility.longitude != null && facility.latitude !== 0 && facility.longitude !== 0;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-badge-row">
            <span className="modal-badge type-badge">{typeName}</span>
            <span className={`modal-badge ${facility.sector === '공공' ? 'sector-pub' : 'sector-prv'}`}>
              {facility.sector}시설물
            </span>
            <span className="modal-badge class-badge">
              <ShieldCheck size={13} /> 시설물안전법 {facility.facilityClass}
            </span>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} title="닫기">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <h2 id="modal-title" className="modal-facility-name">{facility.name}</h2>
          <div className="modal-address-row">
            <MapPin size={16} className="modal-icon text-blue-600" />
            <span className="modal-address-text">{facility.address}</span>
          </div>

          <div className="modal-info-grid">
            <div className="info-cell">
              <span className="cell-label">시설물 분류</span>
              <span className="cell-value">{typeName} ({facility.type})</span>
            </div>
            <div className="info-cell">
              <span className="cell-label">관리 기관</span>
              <span className="cell-value">{facility.managementAgency || '지자체 관할'}</span>
            </div>
            <div className="info-cell">
              <span className="cell-label">준공 연도</span>
              <span className="cell-value">{facility.completionYear ? `${facility.completionYear}년` : '기록 정보 확인 중'}</span>
            </div>
            <div className="info-cell">
              <span className="cell-label">시설 규모</span>
              <span className="cell-value">{facility.scale || '규격 정보 미기재'}</span>
            </div>
            <div className="info-cell full-width">
              <span className="cell-label">위치 좌표 (WGS84)</span>
              <span className="cell-value">
                {hasCoords ? (
                  <span className="coord-text">
                    위도(Lat): {facility.latitude?.toFixed(6)} / 경도(Lng): {facility.longitude?.toFixed(6)}
                  </span>
                ) : (
                  <span className="text-amber-700">
                    좌표 데이터 미제공 (임의 추정 마커 생성 금지 원칙에 따라 지도 표기 제외)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* 안전정보 및 원칙 안내 섹션 */}
          <div className="modal-disclaimer-box">
            <div className="disclaimer-title-row">
              <ShieldAlert size={16} className="text-amber-600" />
              <h4>공공데이터 안내 및 신뢰성 보증</h4>
            </div>
            <p className="disclaimer-text">
              본 서비스는 국토안전관리원 시설물정보관리종합시스템(FMS)에 등록된 객관적 제원 정보를 표시합니다.
              공식 정기안전점검 및 정밀진단 결과를 거치지 않은 <strong>임의의 안전등급(A~E등급)이나 안전점수를 임의로 추정하여 부여하지 않습니다.</strong>
            </p>
          </div>

          {/* 데이터 메타데이터 */}
          <div className="modal-meta-footer">
            <div className="meta-line">
              <Database size={13} />
              <span>출처: {facility.source}</span>
            </div>
            <div className="meta-line">
              <Calendar size={13} />
              <span>데이터 기준일자: {facility.updatedAt}</span>
            </div>
            <div className="meta-line">
              <CheckCircle size={13} className="text-green-600" />
              <span>고유 ID: {facility.id}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-confirm" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
