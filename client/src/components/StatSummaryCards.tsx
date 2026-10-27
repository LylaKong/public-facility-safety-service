import React from 'react';
import { Building2, Landmark, Building, MapPin, Layers } from 'lucide-react';
import type { SidoStat, SectorStatData, TypeMeta } from '../types';

interface StatSummaryCardsProps {
  selectedSido: string;
  sidoStat?: SidoStat;
  sectorStat?: SectorStatData;
  typeMapping?: Record<string, TypeMeta>;
  isLoading: boolean;
}

export const StatSummaryCards: React.FC<StatSummaryCardsProps> = ({
  selectedSido,
  sidoStat,
  sectorStat,
  typeMapping,
  isLoading
}) => {
  if (isLoading && !sidoStat) {
    return (
      <section className="stat-cards-container" aria-label="시설물 통계 요약 (로딩 중)">
        <div className="stat-card skeleton-card"></div>
        <div className="stat-card skeleton-card"></div>
        <div className="stat-card skeleton-card"></div>
        <div className="stat-card skeleton-card"></div>
      </section>
    );
  }

  const regionName = selectedSido === '전체' ? '전국' : selectedSido;
  const totalCount = sidoStat?.total || 0;
  const publicCount = sidoStat?.publicCount || sectorStat?.public?.total || 0;
  const privateCount = sidoStat?.privateCount || sectorStat?.private?.total || 0;

  const publicRatio = totalCount > 0 ? ((publicCount / totalCount) * 100).toFixed(1) : '0.0';
  const privateRatio = totalCount > 0 ? ((privateCount / totalCount) * 100).toFixed(1) : '0.0';

  // Major type counts
  const byType = sidoStat?.byType || {};
  const topTypes = Object.entries(byType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <section className="stat-cards-container" aria-label={`${regionName} 공공시설물 통계 요약`}>
      {/* 1. 전체 시설물 수 */}
      <div className="stat-card card-primary">
        <div className="card-header">
          <span className="card-badge">
            <MapPin size={13} /> {regionName}
          </span>
          <Landmark className="card-icon text-blue-600" size={20} />
        </div>
        <div className="card-body">
          <div className="card-label">총 등록 시설물</div>
          <div className="card-value-row">
            <span className="card-big-number">{totalCount.toLocaleString()}</span>
            <span className="card-unit">개소</span>
          </div>
          <div className="card-footnote">국토안전관리원 등록 1·2·3종 기준</div>
        </div>
      </div>

      {/* 2. 공공부문 시설물 */}
      <div className="stat-card">
        <div className="card-header">
          <span className="card-badge badge-public">공공부문</span>
          <Building2 className="card-icon text-indigo-600" size={20} />
        </div>
        <div className="card-body">
          <div className="card-label">국가·지자체·공공기관 관리</div>
          <div className="card-value-row">
            <span className="card-big-number">{publicCount.toLocaleString()}</span>
            <span className="card-unit">개소 ({publicRatio}%)</span>
          </div>
          <div className="card-progress-bar">
            <div className="bar-fill public-fill" style={{ width: `${publicRatio}%` }}></div>
          </div>
          {sectorStat?.public?.byClass && (
            <div className="class-pills">
              <span>1종 {sectorStat.public.byClass['1종'].toLocaleString()}</span>
              <span>2종 {sectorStat.public.byClass['2종'].toLocaleString()}</span>
              <span>3종 {sectorStat.public.byClass['3종'].toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. 민간부문 시설물 */}
      <div className="stat-card">
        <div className="card-header">
          <span className="card-badge badge-private">민간부문</span>
          <Building className="card-icon text-slate-600" size={20} />
        </div>
        <div className="card-body">
          <div className="card-label">민자사업 및 민간 소유</div>
          <div className="card-value-row">
            <span className="card-big-number">{privateCount.toLocaleString()}</span>
            <span className="card-unit">개소 ({privateRatio}%)</span>
          </div>
          <div className="card-progress-bar">
            <div className="bar-fill private-fill" style={{ width: `${privateRatio}%` }}></div>
          </div>
          {sectorStat?.private?.byClass && (
            <div className="class-pills">
              <span>1종 {sectorStat.private.byClass['1종'].toLocaleString()}</span>
              <span>2종 {sectorStat.private.byClass['2종'].toLocaleString()}</span>
              <span>3종 {sectorStat.private.byClass['3종'].toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. 주요 유형별 분포 */}
      <div className="stat-card">
        <div className="card-header">
          <span className="card-badge">유형별 현황</span>
          <Layers className="card-icon text-teal-600" size={20} />
        </div>
        <div className="card-body">
          <div className="card-label">상위 시설 유형 (개소수)</div>
          <div className="type-distribution-list">
            {topTypes.length > 0 ? (
              topTypes.map(([typeKey, count]) => {
                const meta = typeMapping?.[typeKey];
                const name = meta?.name || typeKey;
                return (
                  <div key={typeKey} className="type-item">
                    <span className="type-name">{name}</span>
                    <span className="type-count">{count.toLocaleString()}개</span>
                  </div>
                );
              })
            ) : (
              <div className="type-item-empty">유형별 통계 집계 중</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
