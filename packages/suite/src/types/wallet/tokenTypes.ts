// copied from wallet's localStorageReducer
export interface NetworkToken {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
}

export interface Token {
    loaded: boolean;
    deviceState: string;
    network: string;
    name: string;
    symbol: string;
    address: string;
    ethAddress: string; // foreign key
    decimals: number;
    balance: string;
}
