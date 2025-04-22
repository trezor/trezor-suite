export interface UpdatedIconsList {
    [id: string]: {
        updatedAt: number;
    };
}

export interface CoinListData {
    id: string;
}

export interface CoinData {
    id: string;
    symbol: string;
    asset_platform_id: string | null;
    contract_address?: string;
    platforms: Record<string, string>;
    image: {
        thumb: string;
        small: string;
        large: string;
    };
}
