import { asNetworkSymbol } from '@suite-common/networks';

import {
    type SendFormRootState,
    selectFeeLevel,
    selectSendFormDraft,
    sendFormInitialState,
    sendFormReducer,
    setAddress,
    setField,
} from './sendFormSlice';

const btc = asNetworkSymbol('btc');
const sol = asNetworkSymbol('sol');

const toRootState = (sendForm: ReturnType<typeof sendFormReducer>): SendFormRootState => ({
    nativeNetworks: { sendForm },
});

describe('sendFormSlice', () => {
    it('returns an empty draft for a network without edits', () => {
        expect(selectSendFormDraft(toRootState(sendFormInitialState), btc)).toEqual({
            address: '',
            fields: {},
        });
    });

    it('keeps drafts of different networks apart', () => {
        const state = [
            setAddress({ networkSymbol: btc, address: 'bc1q...' }),
            setField({ networkSymbol: sol, fieldId: 'memo', value: 'hello' }),
            selectFeeLevel({ networkSymbol: sol, feeLevelId: 'high' }),
        ].reduce(sendFormReducer, sendFormInitialState);

        expect(selectSendFormDraft(toRootState(state), btc)).toEqual({
            address: 'bc1q...',
            fields: {},
        });
        expect(selectSendFormDraft(toRootState(state), sol)).toEqual({
            address: '',
            fields: { memo: 'hello' },
            selectedFeeLevelId: 'high',
        });
    });
});
