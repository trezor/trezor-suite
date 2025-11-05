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
        /**
         * 25x25
         */
        thumb: string;
        /**
         * 50x50
         */
        small: string;
        /**
         * 250x250
         */
        large: string;
    };
}
