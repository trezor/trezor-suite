import produce from 'immer';

interface Fee {
    value: string;
    label: string;
}

export interface State {
    btc: Fee[];
    xrp: Fee[];
    eth: Fee[];
    txrp: Fee[];
}

export const initialState: State = {
    btc: [
        { label: 'high', value: '0.0001995' },
        { label: 'normal', value: '0.000315' },
        { label: 'low', value: '0.001575' },
    ],
    xrp: [{ label: 'normal', value: '0.000012' }],
    txrp: [{ label: 'normal', value: '0.000012' }],
    eth: [{ label: 'normal', value: '0.000012' }],
};

export default (state: State = initialState) => {
    return produce(state, _draft => {
        return state;
    });
};
