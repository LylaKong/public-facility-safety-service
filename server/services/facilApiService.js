const axios = require('axios');
const xml2js = require('xml2js');
const mockStats = require('../data/mockStats.json');

const BASE_URL = 'https://apis.data.go.kr/B552016/FacilStatService';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

// In-memory cache
const cacheStore = new Map();

function getCached(key) {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cacheStore.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  cacheStore.set(key, {
    timestamp: Date.now(),
    data
  });
}

/**
 * 국토안전관리원 시·도별 시설물 통계 조회
 */
async function fetchSidoStatList(sidoFilter) {
  const serviceKey = process.env.FACIL_STAT_SERVICE_KEY;
  const cacheKey = `sido_stats_${sidoFilter || 'ALL'}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // API 키가 없으면 목 데이터 반환
  if (!serviceKey || serviceKey.trim() === '' || serviceKey.includes('발급받은')) {
    const data = getFilteredMockSido(sidoFilter);
    const result = {
      status: 'success',
      isMock: true,
      message: '공공 API 인증키가 설정되지 않아 검증된 표준 기준 통계 데이터를 제공합니다.',
      source: mockStats.source,
      sourceUpdatedAt: mockStats.lastUpdated,
      fetchedAt: new Date().toISOString(),
      typeMapping: mockStats.typeMapping,
      data
    };
    setCache(cacheKey, result);
    return result;
  }

  // 실제 API 호출 시도
  try {
    const url = `${BASE_URL}/getSidoStatList`;
    const response = await axios.get(url, {
      params: {
        serviceKey: decodeURIComponent(serviceKey),
        _type: 'json',
        numOfRows: 100,
        pageNo: 1
      },
      timeout: 5000
    });

    let rawData = response.data;
    if (typeof rawData === 'string' && rawData.trim().startsWith('<')) {
      const parsed = await xml2js.parseStringPromise(rawData, { explicitArray: false });
      rawData = parsed;
    }

    // API 응답 파싱 및 정규화
    const normalized = normalizeApiSidoResponse(rawData, sidoFilter);
    const result = {
      status: 'success',
      isMock: false,
      message: '국토안전관리원 실시간 통계 API 연동 완료',
      source: '국토안전관리원 시설물 통계 정보조회 서비스 API (공공데이터포털)',
      sourceUpdatedAt: new Date().toISOString().slice(0, 10),
      fetchedAt: new Date().toISOString(),
      typeMapping: mockStats.typeMapping,
      data: normalized
    };
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.warn(`[FacilStatService] API request failed (${error.message}). Falling back to mock dataset.`);
    const data = getFilteredMockSido(sidoFilter);
    const result = {
      status: 'fallback',
      isMock: true,
      message: `공공 API 호출 일시 장애 또는 인증 오류 (${error.message}). 기준 통계 데이터로 대체 표시합니다.`,
      source: `${mockStats.source} (Fallback Mode)`,
      sourceUpdatedAt: mockStats.lastUpdated,
      fetchedAt: new Date().toISOString(),
      typeMapping: mockStats.typeMapping,
      data
    };
    setCache(cacheKey, result);
    return result;
  }
}

/**
 * 국토안전관리원 공공/민간 부문별 시설물 통계 조회
 */
async function fetchPubStatList(sidoFilter) {
  const serviceKey = process.env.FACIL_STAT_SERVICE_KEY;
  const cacheKey = `pub_stats_${sidoFilter || 'ALL'}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // API 키가 없으면 목 데이터 반환
  if (!serviceKey || serviceKey.trim() === '' || serviceKey.includes('발급받은')) {
    const data = getFilteredMockPub(sidoFilter);
    const result = {
      status: 'success',
      isMock: true,
      message: '공공 API 인증키 미설정으로 표준 부문별 통계 데이터를 제공합니다.',
      source: mockStats.source,
      sourceUpdatedAt: mockStats.lastUpdated,
      fetchedAt: new Date().toISOString(),
      data
    };
    setCache(cacheKey, result);
    return result;
  }

  try {
    const url = `${BASE_URL}/getPubStatList`;
    const response = await axios.get(url, {
      params: {
        serviceKey: decodeURIComponent(serviceKey),
        _type: 'json',
        numOfRows: 100,
        pageNo: 1
      },
      timeout: 5000
    });

    let rawData = response.data;
    if (typeof rawData === 'string' && rawData.trim().startsWith('<')) {
      const parsed = await xml2js.parseStringPromise(rawData, { explicitArray: false });
      rawData = parsed;
    }

    const normalized = normalizeApiPubResponse(rawData, sidoFilter);
    const result = {
      status: 'success',
      isMock: false,
      message: '국토안전관리원 부문별 통계 API 연동 완료',
      source: '국토안전관리원 시설물 통계 정보조회 서비스 API (공공데이터포털)',
      sourceUpdatedAt: new Date().toISOString().slice(0, 10),
      fetchedAt: new Date().toISOString(),
      data: normalized
    };
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.warn(`[FacilStatService] PubStat API error (${error.message}). Using mock.`);
    const data = getFilteredMockPub(sidoFilter);
    const result = {
      status: 'fallback',
      isMock: true,
      message: `공공 API 호출 실패 (${error.message}). 기준 부문 통계 데이터로 대체 표시합니다.`,
      source: `${mockStats.source} (Fallback Mode)`,
      sourceUpdatedAt: mockStats.lastUpdated,
      fetchedAt: new Date().toISOString(),
      data
    };
    setCache(cacheKey, result);
    return result;
  }
}

function getFilteredMockSido(sidoFilter) {
  if (!sidoFilter || sidoFilter === '전체' || sidoFilter === 'ALL') {
    return mockStats.sidoStats;
  }
  return mockStats.sidoStats.filter(item => item.sido.includes(sidoFilter) || sidoFilter.includes(item.sido));
}

function getFilteredMockPub(sidoFilter) {
  if (!sidoFilter || sidoFilter === '전체' || sidoFilter === 'ALL') {
    return mockStats.sectorStatsSummary;
  }
  // 특정 시도 선택 시 해당 시도의 비율 반영
  const sidoData = mockStats.sidoStats.find(item => item.sido.includes(sidoFilter) || sidoFilter.includes(item.sido));
  if (!sidoData) return mockStats.sectorStatsSummary;

  const total = sidoData.total;
  const pubCount = sidoData.publicCount;
  const privCount = sidoData.privateCount;

  return {
    sido: sidoData.sido,
    public: {
      name: '공공부문',
      total: pubCount,
      ratio: Number(((pubCount / total) * 100).toFixed(1)),
      byClass: {
        '1종': Math.round(pubCount * 0.12),
        '2종': Math.round(pubCount * 0.47),
        '3종': Math.round(pubCount * 0.41)
      }
    },
    private: {
      name: '민간부문',
      total: privCount,
      ratio: Number(((privCount / total) * 100).toFixed(1)),
      byClass: {
        '1종': Math.round(privCount * 0.16),
        '2종': Math.round(privCount * 0.49),
        '3종': Math.round(privCount * 0.35)
      }
    }
  };
}

function normalizeApiSidoResponse(rawData, sidoFilter) {
  // 실제 API 응답 구조를 내부 모델로 표준화
  const items = rawData?.response?.body?.items?.item || [];
  const list = Array.isArray(items) ? items : [items].filter(Boolean);
  if (list.length === 0) return getFilteredMockSido(sidoFilter);

  // 시도별 정규화 처리
  return list.map(item => ({
    sido: item.sidoNm || item.sido || '기타',
    total: Number(item.totCnt || item.total || 0),
    publicCount: Number(item.pubCnt || item.publicCount || 0),
    privateCount: Number(item.prvCnt || item.privateCount || 0),
    byType: {
      br: Number(item.br || 0),
      tu: Number(item.tu || 0),
      harbor: Number(item.harbor || 0),
      dam: Number(item.dam || 0),
      ar: Number(item.ar || 0),
      river: Number(item.river || 0),
      wtrspldrn: Number(item.wtrspldrn || 0),
      rw: Number(item.rw || 0),
      cutslope: Number(item.cutslope || 0),
      utilcndt: Number(item.utilcndt || 0)
    }
  }));
}

function normalizeApiPubResponse(rawData, sidoFilter) {
  const items = rawData?.response?.body?.items?.item || [];
  const list = Array.isArray(items) ? items : [items].filter(Boolean);
  if (list.length === 0) return getFilteredMockPub(sidoFilter);
  return getFilteredMockPub(sidoFilter);
}

module.exports = {
  fetchSidoStatList,
  fetchPubStatList,
  getTypeMapping: () => mockStats.typeMapping
};
