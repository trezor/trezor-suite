import { SignedTransaction } from '@trezor/connect';
import { pushTransactionInternal } from '../../sendFormActions/pushTransactionInternal';
import { Dispatch } from 'src/types/suite';
import { configureMockStore } from '@suite-common/test-utils';

const initStore = () => configureMockStore({});

describe(pushTransactionInternal.name, () => {
    it('', () => {
        const store = initStore();

        const transaction: SignedTransaction['signedTransaction'] = {
            txid: '334759055c86985b28ec3ba783336a113af46692790b179fa7bb49b88dd2323e',
            vin: [],
            vout: [],
            blockHeight: 123456,
            confirmations: 42,
            blockTime: 1234,
            value: '',
            valueIn: '',
            fees: ',',
        };
        const dispatch: Dispatch = () => undefined;

        pushTransactionInternal(transaction)(dispatch, store.getState);

        console.log(store.getState().actions);
    });
});
