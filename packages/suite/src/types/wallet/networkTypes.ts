interface Explorer {
    tx: string;
    address: string;
}

export interface Network {
    name: string;
    networkType?: 'bitcoin' | 'ripple' | 'ethereum';
    accountType?: 'normal' | 'legacy' | 'segwit';
    symbol: string;
    bip44: string;
    isHidden?: boolean;
    hasSignVerify?: boolean;
    explorer: Explorer;
}
