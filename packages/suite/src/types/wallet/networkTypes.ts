interface Explorer {
    tx: string;
    address: string;
}

export interface Network {
    name: string;
    isHidden: boolean | undefined | null;
    networkType: string;
    accountType: 'normal' | 'legacy' | 'segwit';
    symbol: string;
    bip44: string;
    hasSignVerify: boolean;
    explorer: Explorer;
}
