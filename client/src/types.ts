export type FacilityTypeKey = 
  | 'br'
  | 'tu'
  | 'harbor'
  | 'dam'
  | 'ar'
  | 'river'
  | 'wtrspldrn'
  | 'rw'
  | 'cutslope'
  | 'utilcndt';

export interface TypeMeta {
  name: string;
  category: string;
  icon: string;
}

export interface SidoStat {
  sido: string;
  total: number;
  publicCount: number;
  privateCount: number;
  byType: Record<string, number>;
}

export interface SectorStatItem {
  name: string;
  total: number;
  ratio: number;
  byClass: {
    '1종': number;
    '2종': number;
    '3종': number;
  };
}

export interface SectorStatData {
  sido?: string;
  public: SectorStatItem;
  private: SectorStatItem;
}

export interface Facility {
  id: string;
  sido: string;
  name: string;
  type: FacilityTypeKey;
  typeName: string;
  sector: '공공' | '민간';
  facilityClass: '1종' | '2종' | '3종';
  address: string;
  latitude: number | null;
  longitude: number | null;
  completionYear?: number;
  scale?: string;
  managementAgency?: string;
  source: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  status: 'success' | 'fallback' | 'error';
  isMock?: boolean;
  message?: string;
  source: string;
  sourceUpdatedAt?: string;
  fetchedAt: string;
  typeMapping?: Record<string, TypeMeta>;
  data: T;
}

export interface FacilitiesResponse {
  status: string;
  totalCount: number;
  withCoordinatesCount: number;
  missingCoordinatesCount: number;
  fetchedAt: string;
  source: string;
  items: Facility[];
}
