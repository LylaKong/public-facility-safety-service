import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Facility, TypeMeta } from '../types';
import { Navigation, Info } from 'lucide-react';

interface MapViewProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (f: Facility) => void;
  selectedSido: string;
  typeMapping?: Record<string, TypeMeta>;
}

// 시·도별 중심 좌표 및 적정 줌 레벨
const SIDO_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  전체: { lat: 36.3, lng: 127.8, zoom: 7 },
  서울특별시: { lat: 37.5665, lng: 126.9780, zoom: 11 },
  경기도: { lat: 37.4138, lng: 127.5183, zoom: 9 },
  부산광역시: { lat: 35.1796, lng: 129.0756, zoom: 11 },
  인천광역시: { lat: 37.4563, lng: 126.7052, zoom: 10 },
  대구광역시: { lat: 35.8714, lng: 128.6014, zoom: 11 },
  대전광역시: { lat: 36.3504, lng: 127.3845, zoom: 11 },
  광주광역시: { lat: 35.1595, lng: 126.8526, zoom: 11 },
  울산광역시: { lat: 35.5384, lng: 129.3114, zoom: 11 },
  세종특별자치시: { lat: 36.4800, lng: 127.2890, zoom: 11 },
  강원특별자치도: { lat: 37.8228, lng: 128.1555, zoom: 9 },
  충청북도: { lat: 36.6357, lng: 127.4912, zoom: 9 },
  충청남도: { lat: 36.5184, lng: 126.8000, zoom: 9 },
  전북특별자치도: { lat: 35.7175, lng: 127.1530, zoom: 9 },
  전라남도: { lat: 34.8679, lng: 126.9910, zoom: 9 },
  경상북도: { lat: 36.4919, lng: 128.8889, zoom: 9 },
  경상남도: { lat: 35.4606, lng: 128.2132, zoom: 9 },
  제주특별자치도: { lat: 33.4996, lng: 126.5312, zoom: 10 }
};

export const MapView: React.FC<MapViewProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  selectedSido,
  typeMapping = {}
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  // 1. 지도 초기화
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initial = SIDO_CENTERS[selectedSido] || SIDO_CENTERS['전체'];
    const map = L.map(mapContainerRef.current, {
      center: [initial.lat, initial.lng],
      zoom: initial.zoom,
      zoomControl: false
    });

    // 지도 타일 (OpenStreetMap 기반)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Zoom 컨트롤 우하단 배치
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 마커 레이어 그룹 생성
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. 지역(시·도) 변경 시 지도 뷰 이동
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const target = SIDO_CENTERS[selectedSido] || SIDO_CENTERS['전체'];
    map.flyTo([target.lat, target.lng], target.zoom, {
      duration: 1.2
    });
  }, [selectedSido]);

  // 3. 마커 갱신 (유효한 좌표를 가진 시설물만 표시)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    markerMapRef.current.clear();

    const validFacilities = facilities.filter(
      (f) => f.latitude != null && f.longitude != null && f.latitude !== 0 && f.longitude !== 0
    );

    validFacilities.forEach((facility) => {
      const isSelected = selectedFacility?.id === facility.id;
      const typeName = typeMapping[facility.type]?.name || facility.typeName || '시설물';

      // SVG 기반 커스텀 DivIcon
      const iconHtml = `
        <div class="custom-marker ${isSelected ? 'marker-selected' : ''}" data-id="${facility.id}">
          <div class="marker-pin">
            <span class="marker-type-badge">${typeName}</span>
            <div class="marker-arrow"></div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'facility-div-icon',
        html: iconHtml,
        iconSize: [60, 36],
        iconAnchor: [30, 36],
        popupAnchor: [0, -36]
      });

      const marker = L.marker([facility.latitude!, facility.longitude!], {
        icon: customIcon,
        title: facility.name
      });

      // 팝업 내용 구성
      const popupContent = `
        <div class="map-popup-card">
          <div class="popup-header">
            <span class="popup-type-tag">${typeName}</span>
            <span class="popup-sector-tag ${facility.sector === '공공' ? 'tag-pub' : 'tag-prv'}">${facility.sector}</span>
            <span class="popup-class-tag">${facility.facilityClass}</span>
          </div>
          <h4 class="popup-title">${facility.name}</h4>
          <p class="popup-address">${facility.address}</p>
          ${facility.scale ? `<p class="popup-scale"><strong>규모:</strong> ${facility.scale}</p>` : ''}
          <div class="popup-footer">
            <span class="popup-source">출처: ${facility.source}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: true,
        className: 'custom-leaflet-popup'
      });

      marker.on('click', () => {
        onSelectFacility(facility);
      });

      marker.addTo(markersLayer);
      markerMapRef.current.set(facility.id, marker);
    });
  }, [facilities, typeMapping]);

  // 4. 외부(목록 클릭 등)에서 selectedFacility 변경 시 마커 포커스 및 팝업 열기
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedFacility) return;

    if (
      selectedFacility.latitude != null &&
      selectedFacility.longitude != null &&
      selectedFacility.latitude !== 0 &&
      selectedFacility.longitude !== 0
    ) {
      map.flyTo([selectedFacility.latitude, selectedFacility.longitude], 14, {
        duration: 0.8
      });

      const marker = markerMapRef.current.get(selectedFacility.id);
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedFacility]);

  // 내 위치 탐색 핸들러
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('접속하신 브라우저가 위치 정보 서비스를 지원하지 않습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([latitude, longitude], 13, { duration: 1.0 });

          // 내 위치 마커 표시
          L.circleMarker([latitude, longitude], {
            radius: 8,
            color: '#2563eb',
            fillColor: '#60a5fa',
            fillOpacity: 0.8,
            weight: 3
          })
            .addTo(map)
            .bindPopup('<strong>내 현재 위치</strong>')
            .openPopup();
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        alert('위치 권한이 거부되었거나 위치를 가져올 수 없습니다. 상단에서 조회할 시·도를 직접 선택해주세요.');
      },
      { timeout: 7000 }
    );
  };

  const validMarkersCount = facilities.filter(
    (f) => f.latitude != null && f.longitude != null && f.latitude !== 0 && f.longitude !== 0
  ).length;

  return (
    <div className="map-view-wrapper">
      {/* 지도 컨테이너 */}
      <div ref={mapContainerRef} className="leaflet-map-canvas" />

      {/* 지도 상단 오버레이 안내바 */}
      <div className="map-top-overlay">
        <div className="map-info-pill">
          <Info size={13} className="info-icon" />
          <span>등록된 시설물 <strong>{validMarkersCount}</strong>개 마커 표시 중</span>
        </div>
        <button
          type="button"
          className="map-locate-btn"
          onClick={handleLocateMe}
          title="내 주변 위치로 이동"
        >
          <Navigation size={14} />
          <span>내 위치</span>
        </button>
      </div>

      {/* 하단 범례 및 출처 */}
      <div className="map-bottom-legend">
        <span className="legend-title">시설물 마커</span>
        <div className="legend-items">
          <span className="legend-item"><span className="legend-color-dot dot-navy"></span>공공시설</span>
          <span className="legend-item"><span className="legend-color-dot dot-gray"></span>민간시설</span>
          <span className="legend-item"><span className="legend-color-dot dot-orange"></span>선택 시설</span>
        </div>
      </div>
    </div>
  );
};
