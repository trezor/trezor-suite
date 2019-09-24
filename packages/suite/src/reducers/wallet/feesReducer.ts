import produce from 'immer';

export interface FeeItem {
    value: string;
    label: string;
}

export interface Fee {
    btc: FeeItem[];
    xrp: FeeItem[];
    eth: FeeItem[];
    ltc: FeeItem[];
    etc: FeeItem[];
    trop: FeeItem[];
    test: FeeItem[];
    bch: FeeItem[];
    btg: FeeItem[];
    dash: FeeItem[];
    txrp: FeeItem[];
    dgb: FeeItem[];
    doge: FeeItem[];
    nmc: FeeItem[];
    vtc: FeeItem[];
    zec: FeeItem[];
}

export const initialState: Fee = {
    btc: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    xrp: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    txrp: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    eth: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    ltc: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    test: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    trop: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    etc: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    bch: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    btg: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    dash: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    dgb: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    doge: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    nmc: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    vtc: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    zec: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
};

export default (state: Fee = initialState) => {
    return produce(state, _draft => {
        return state;
    });
};
