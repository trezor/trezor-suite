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
    symbol: string;
    name: string;
    address: string;
    ethAddress: string; // foreign key
    decimals: number;
    balance: string;
}
