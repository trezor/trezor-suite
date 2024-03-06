export interface NftData {
    id: string;
    contract_address: string;
    name: string;
    asset_platform_id: string;
    symbol: string;
}

export interface CoinData {
    id: string;
    symbol: string;
    name: string;
    platforms: { [key: string]: string };
}
