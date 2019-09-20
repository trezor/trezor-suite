interface Explorer {
    tx: string;
    address: string;
}

export interface Network {
    name: string;
    networkType: 'bitcoin' | 'ripple' | 'ethereum';
    accountType?: 'normal' | 'legacy' | 'segwit';
    symbol: string;
    bip44: string;
    testnet?: boolean;
    isHidden?: boolean;
    hasSignVerify?: boolean;
    decimals: number;
    explorer: Explorer;
}
export interface ExternalNetwork {
    networkType: 'external';
    name: string;
    symbol: string;
    url: string;
    isHidden?: boolean;
}
