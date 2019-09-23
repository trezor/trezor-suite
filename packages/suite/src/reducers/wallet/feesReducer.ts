import produce from 'immer';

export interface FeeItem {
    value: string;
    label: string;
}

export interface Fee {
    btc: FeeItem[];
    xrp: FeeItem[];
    eth: FeeItem[];
    txrp: FeeItem[];
}

export const initialState: Fee = {
    btc: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    xrp: [{ label: 'normal', value: '0.000012' }],
    txrp: [{ label: 'normal', value: '0.000012' }],
    eth: [{ label: 'normal', value: '0.000012' }],
};

export default (state: Fee = initialState) => {
    return produce(state, _draft => {
        return state;
    });
};
