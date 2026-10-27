import React from 'react';
import { ShieldCheck, Info, Database, Clock, RefreshCw } from 'lucide-react';

interface HeaderProps {
  fetchedAt?: string;
  sourceUpdatedAt?: string;
  isMock?: boolean;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  fetchedAt,
  sourceUpdatedAt,
  isMock,
  onRefresh,
  isLoading
}) => {
  const formatTime = (iso?: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch {
      return iso;
    }
  };

  return (
    <header className="header-container">
      <div className="header-left">
        <div className="logo-badge">
          <ShieldCheck className="logo-icon" size={26} />
        </div>
        <div>
          <div className="header-title-row">
            <h1 className="header-title">우리동네 공공시설물 안전정보</h1>
            <span className="version-pill">v1.0 MVP</span>
          </div>
          <p className="header-subtitle">
            국토안전관리원 시설물 통계 정보조회 서비스 기반 지역별 공공인프라 현황
          </p>
        </div>
      </div>

      <div className="header-right">
        <div className="meta-box">
          <div className="meta-item">
            <Database size={13} className="meta-icon" />
            <span className="meta-label">출처:</span>
            <span className="meta-value">국토안전관리원(FMS)</span>
          </div>
          <div className="meta-item">
            <Clock size={13} className="meta-icon" />
            <span className="meta-label">조회:</span>
            <span className="meta-value">{formatTime(fetchedAt)}</span>
          </div>
          {sourceUpdatedAt && (
            <div className="meta-item">
              <Info size={13} className="meta-icon" />
              <span className="meta-label">기준일:</span>
              <span className="meta-value">{sourceUpdatedAt}</span>
            </div>
          )}
        </div>

        <div className="header-actions">
          <span className={`status-badge ${isMock ? 'badge-mock' : 'badge-live'}`}>
            <span className="status-dot"></span>
            {isMock ? '공공 기준 통계 모드' : '공공 API 실시간 연동'}
          </span>
          <button 
            className="refresh-btn" 
            onClick={onRefresh} 
            disabled={isLoading}
            title="데이터 새로고침"
          >
            <RefreshCw size={15} className={isLoading ? 'spin-icon' : ''} />
            <span className="refresh-text">새로고침</span>
          </button>
        </div>
      </div>
    </header>
  );
};
