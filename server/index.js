require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { fetchSidoStatList, fetchPubStatList, getTypeMapping } = require('./services/facilApiService');
const sampleFacilities = require('./data/sampleFacilities.json');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check & Server info
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(process.env.FACIL_STAT_SERVICE_KEY && !process.env.FACIL_STAT_SERVICE_KEY.includes('발급받은'));
  res.json({
    status: 'ok',
    service: '우리동네 공공시설물 안전정보 서비스 API 서버',
    apiKeyConfigured: hasKey,
    facilityCount: sampleFacilities.length,
    timestamp: new Date().toISOString()
  });
});

// 1. 시·도별 통계 조회
app.get('/api/stats/sido', async (req, res) => {
  try {
    const { sido } = req.query;
    const result = await fetchSidoStatList(sido);
    res.json(result);
  } catch (error) {
    console.error('Error fetching sido stats:', error);
    res.status(500).json({
      status: 'error',
      message: '시·도별 통계 조회 중 서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 2. 부문별(공공/민간) 통계 조회
app.get('/api/stats/sector', async (req, res) => {
  try {
    const { sido } = req.query;
    const result = await fetchPubStatList(sido);
    res.json(result);
  } catch (error) {
    console.error('Error fetching sector stats:', error);
    res.status(500).json({
      status: 'error',
      message: '부문별 통계 조회 중 서버 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 3. 시설물 유형 메타데이터
app.get('/api/stats/types', (req, res) => {
  res.json({
    status: 'success',
    types: getTypeMapping()
  });
});

// 4. 개별 시설물 목록 (필터/검색 지원)
app.get('/api/facilities', (req, res) => {
  try {
    const { sido, type, sector, search } = req.query;

    let filtered = [...sampleFacilities];

    // 시·도 필터
    if (sido && sido !== '전체' && sido !== 'ALL') {
      filtered = filtered.filter(f => f.sido.includes(sido) || sido.includes(f.sido));
    }

    // 시설물 유형 필터 (br, tu, dam, etc.)
    if (type && type !== '전체' && type !== 'ALL') {
      filtered = filtered.filter(f => f.type === type);
    }

    // 부문 필터 (공공 / 민간)
    if (sector && sector !== '전체') {
      filtered = filtered.filter(f => f.sector === sector);
    }

    // 검색어 필터 (시설물명, 주소)
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(f => 
        (f.name && f.name.toLowerCase().includes(q)) ||
        (f.address && f.address.toLowerCase().includes(q)) ||
        (f.typeName && f.typeName.toLowerCase().includes(q))
      );
    }

    const hasCoords = filtered.filter(f => f.latitude != null && f.longitude != null && f.latitude !== 0 && f.longitude !== 0);
    const missingCoords = filtered.filter(f => f.latitude == null || f.longitude == null || f.latitude === 0 || f.longitude === 0);

    res.json({
      status: 'success',
      totalCount: filtered.length,
      withCoordinatesCount: hasCoords.length,
      missingCoordinatesCount: missingCoords.length,
      fetchedAt: new Date().toISOString(),
      source: '국토안전관리원 시설물정보관리종합시스템(FMS) 연계 데이터셋',
      items: filtered
    });
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({
      status: 'error',
      message: '시설물 목록 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 5. 개별 시설물 단건 상세 정보
app.get('/api/facilities/:id', (req, res) => {
  const facility = sampleFacilities.find(f => f.id === req.params.id);
  if (!facility) {
    return res.status(404).json({
      status: 'error',
      message: '해당 시설물 정보를 찾을 수 없습니다.'
    });
  }
  res.json({
    status: 'success',
    data: facility,
    disclaimer: '본 정보는 등록된 시설물 제원 정보이며, 임의의 안전등급 또는 점검 결과를 포함하지 않습니다.'
  });
});

const path = require('path');

// ... static files for production ...
const clientDistPath = path.join(__dirname, '../client/dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[우리동네 공공시설물 안전정보 서버] Running on http://localhost:${PORT}`);
});
