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
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    xrp: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    txrp: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    eth: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    ltc: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    test: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    trop: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    etc: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    bch: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    btg: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    dash: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    dgb: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    doge: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    nmc: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    vtc: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
    zec: [
        { label: 'High', value: '0.0001995' },
        { label: 'Normal', value: '0.000315' },
        { label: 'Low', value: '0.001575' },
    ],
};

export default (state: Fee = initialState) => {
    return produce(state, _draft => {
        return state;
    });
};
