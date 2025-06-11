export type ApiData = {
    market_caps: Array<[number, number]>;
    total_volumes: Array<[number, number]>;
    prices: Array<[number, number]>;
};

export type RawDataItem = {
    date: string;
    value: number;
    fiatValue?: number;
};

export type MetaData = {
    min: number | null;
    max: number | null;
    average: number | null;
};
