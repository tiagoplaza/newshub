export interface Banner {
    id: string;
    name: string;
    zoneId: string;
    renderIn: string;
    enabled: boolean;
}

export interface Settings {
    active: boolean;
    autoTagZoneId: string;
    enableAutoTag: boolean;
    banners: Banner[];
}
