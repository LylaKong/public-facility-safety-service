import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SafetyNoticeBanner } from './components/SafetyNoticeBanner';
import { StatSummaryCards } from './components/StatSummaryCards';
import { FilterBar } from './components/FilterBar';
import { MapView } from './components/MapView';
import { FacilityList } from './components/FacilityList';
import { FacilityDetailModal } from './components/FacilityDetailModal';
import type {
  SidoStat,
  SectorStatData,
  Facility,
  TypeMeta,
  ApiResponse,
  FacilitiesResponse
} from './types';
import { Map, List, AlertCircle, RefreshCw } from 'lucide-react';
import './App.css';

export const App: React.FC = () => {
  // 1. 필터 상태
  const [selectedSido, setSelectedSido] = useState<string>('서울특별시');
  const [selectedType, setSelectedType] = useState<string>('전체');
  const [selectedSector, setSelectedSector] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 2. 데이터 상태
  const [sidoStat, setSidoStat] = useState<SidoStat | undefined>();
  const [sectorStat, setSectorStat] = useState<SectorStatData | undefined>();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [typeMapping, setTypeMapping] = useState<Record<string, TypeMeta>>({});
  const [withCoordinatesCount, setWithCoordinatesCount] = useState<number>(0);
  const [missingCoordinatesCount, setMissingCoordinatesCount] = useState<number>(0);

  // 3. UI 및 상호작용 상태
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [detailModalFacility, setDetailModalFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'map' | 'list'>('map');

  // 4. API 메타데이터
  const [apiMeta, setApiMeta] = useState<{
    fetchedAt?: string;
    sourceUpdatedAt?: string;
    isMock?: boolean;
    source?: string;
  }>({});

  // 시설물 유형 메타데이터 최초 1회 로드
  useEffect(() => {
    fetch('/api/stats/types')
      .then((res) => res.json())
      .then((data) => {
        if (data.types) {
          setTypeMapping(data.types);
        }
      })
      .catch((err) => console.warn('Types metadata fetch error:', err));
  }, []);

  // 통계 및 시설물 목록 데이터 로드 함수
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const sidoParam = encodeURIComponent(selectedSido);
      const typeParam = encodeURIComponent(selectedType);
      const sectorParam = encodeURIComponent(selectedSector);
      const searchParam = encodeURIComponent(searchQuery);

      // 병렬 요청
      const [sidoRes, sectorRes, facilRes] = await Promise.all([
        fetch(`/api/stats/sido?sido=${sidoParam}`),
        fetch(`/api/stats/sector?sido=${sidoParam}`),
        fetch(`/api/facilities?sido=${sidoParam}&type=${typeParam}&sector=${sectorParam}&search=${searchParam}`)
      ]);

      if (!sidoRes.ok || !sectorRes.ok || !facilRes.ok) {
        throw new Error('공공데이터 서비스 API 응답 오류가 발생했습니다.');
      }

      const sidoJson: ApiResponse<SidoStat[]> = await sidoRes.json();
      const sectorJson: ApiResponse<SectorStatData> = await sectorRes.json();
      const facilJson: FacilitiesResponse = await facilRes.json();

      // 시도 통계 설정
      if (Array.isArray(sidoJson.data) && sidoJson.data.length > 0) {
        const found = sidoJson.data.find(
          (item) => item.sido.includes(selectedSido) || selectedSido.includes(item.sido)
        );
        setSidoStat(found || sidoJson.data[0]);
      } else {
        setSidoStat(undefined);
      }

      // 부문 통계 설정
      setSectorStat(sectorJson.data);

      // 시설물 목록 및 좌표 수량 설정
      setFacilities(facilJson.items || []);
      setWithCoordinatesCount(facilJson.withCoordinatesCount || 0);
      setMissingCoordinatesCount(facilJson.missingCoordinatesCount || 0);

      // 메타 정보 갱신
      setApiMeta({
        fetchedAt: sidoJson.fetchedAt,
        sourceUpdatedAt: sidoJson.sourceUpdatedAt,
        isMock: sidoJson.isMock,
        source: sidoJson.source
      });
    } catch (err: any) {
      console.error('Data load error:', err);
      setApiError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSido, selectedType, selectedSector, searchQuery]);

  // 필터 변경 시 자동 데이터 재조회
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 필터 초기화
  const handleResetFilters = () => {
    setSelectedSido('서울특별시');
    setSelectedType('전체');
    setSelectedSector('전체');
    setSearchQuery('');
    setSelectedFacility(null);
  };

  // 시설물 선택 핸들러 (지도 & 목록 상호작용)
  const handleSelectFacility = (facility: Facility) => {
    setSelectedFacility(facility);
  };

  return (
    <div className="app-container">
      {/* 1. 글로벌 헤더 */}
      <Header
        fetchedAt={apiMeta.fetchedAt}
        sourceUpdatedAt={apiMeta.sourceUpdatedAt}
        isMock={apiMeta.isMock}
        onRefresh={loadData}
        isLoading={isLoading}
      />

      {/* 2. 안전정보 및 공공데이터 원칙 안내 배너 */}
      <SafetyNoticeBanner />

      <main className="main-content-layout">
        {/* 오류 발생 시 피드백 배너 */}
        {apiError && (
          <div className="error-alert-box" role="alert">
            <AlertCircle className="error-icon" size={20} />
            <div className="error-message-content">
              <strong>조회 오류 안내:</strong> {apiError}
            </div>
            <button type="button" className="retry-btn" onClick={loadData}>
              <RefreshCw size={14} /> 다시 시도
            </button>
          </div>
        )}

        {/* 3. 시·도 및 부문별 통계 카드 요약 */}
        <StatSummaryCards
          selectedSido={selectedSido}
          sidoStat={sidoStat}
          sectorStat={sectorStat}
          typeMapping={typeMapping}
          isLoading={isLoading}
        />

        {/* 4. 검색 및 필터 컨트롤 바 */}
        <FilterBar
          selectedSido={selectedSido}
          onSelectSido={setSelectedSido}
          selectedType={selectedType}
          onSelectType={setSelectedType}
          selectedSector={selectedSector}
          onSelectSector={setSelectedSector}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onReset={handleResetFilters}
          typeMapping={typeMapping}
          totalCount={facilities.length}
          withCoordinatesCount={withCoordinatesCount}
          missingCoordinatesCount={missingCoordinatesCount}
        />

        {/* 모바일 전용 탭 전환 버튼 (PRD 3.3 대응) */}
        <div className="mobile-tab-switch" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeMobileTab === 'map'}
            className={`mobile-tab-btn ${activeMobileTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveMobileTab('map')}
          >
            <Map size={16} />
            <span>지도 보기 ({withCoordinatesCount})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMobileTab === 'list'}
            className={`mobile-tab-btn ${activeMobileTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveMobileTab('list')}
          >
            <List size={16} />
            <span>목록 보기 ({facilities.length})</span>
          </button>
        </div>

        {/* 5. 메인 분할 뷰: Leaflet 지도 + 시설물 목록 */}
        <div className="map-and-list-grid">
          {/* 좌측: Leaflet 지도 영역 */}
          <section 
            className={`map-section-panel ${activeMobileTab === 'map' ? 'mobile-visible' : 'mobile-hidden'}`}
            aria-label="시설물 위치 지도"
          >
            <MapView
              facilities={facilities}
              selectedFacility={selectedFacility}
              onSelectFacility={handleSelectFacility}
              selectedSido={selectedSido}
              typeMapping={typeMapping}
            />
          </section>

          {/* 우측: 시설물 목록 영역 */}
          <section 
            className={`list-section-panel ${activeMobileTab === 'list' ? 'mobile-visible' : 'mobile-hidden'}`}
            aria-label="시설물 상세 목록"
          >
            <FacilityList
              facilities={facilities}
              selectedFacility={selectedFacility}
              onSelectFacility={handleSelectFacility}
              onOpenDetail={(f) => setDetailModalFacility(f)}
              isLoading={isLoading}
              typeMapping={typeMapping}
            />
          </section>
        </div>
      </main>

      {/* 6. 개별 시설물 상세 모달 */}
      <FacilityDetailModal
        facility={detailModalFacility}
        onClose={() => setDetailModalFacility(null)}
        typeMapping={typeMapping}
      />

      {/* 7. 서비스 푸터 */}
      <footer className="app-footer">
        <div className="footer-content">
          <p className="footer-copyright">
            © 2026 우리동네 공공시설물 안전정보 서비스. Data provided by 국토안전관리원 및 공공데이터포털.
          </p>
          <p className="footer-notice">
            ※ 본 사이트는 공공인프라 통계 및 위치 정보를 공공데이터 규정에 따라 안전하게 서비스하며, 영리적 목적이나 임의의 등급 판정에 사용되지 않습니다.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
