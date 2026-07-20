export interface UpdatedIconsList {
    [id: string]: {
        updatedAt: number;
        // Source image URL (incl. CoinGecko's version query param) of the last successfully
        // written icon. Used to skip coins whose logo has not changed since the previous run.
        imageUrl?: string;
    };
}

export interface CoinListData {
    id: string;
    // present because /coins/list is queried with include_platform=true
    platforms?: Record<string, string>;
}

// Subset of the /coins/markets response we rely on. `image` is the "large" asset URL
// (same one as CoinData.image.large), or a "missing_large.png" placeholder for logo-less coins.
export interface CoinMarketData {
    id: string;
    image: string;
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
