import type { FeeInfo, FormState } from '@suite-common/wallet-types';
import { createStoreFromPreloadedState } from '@suite-native/test-utils-store';
import type { ReduxStoreWithThunk } from '@trezor/redux-utils';

import { BTC_ACCOUNT_KEY, getBtcAccount } from './__fixtures__/walletState';
import {
    type CalculateFeeLevelsMaxAmountThunkState,
    calculateFeeLevelsMaxAmountThunk,
} from './thunks';

const mockComposeSendFormTransactionFeeLevelsThunk = jest.fn();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    composeSendFormTransactionFeeLevelsThunk: (params: unknown) => () => {
        mockComposeSendFormTransactionFeeLevelsThunk(params);

        return Promise.resolve({
            type: 'composeSendFormTransactionFeeLevelsThunk/fulfilled',
            payload: {
                normal: { type: 'final', max: '0.009' },
                economy: { type: 'final', max: '0.008' },
            },
            meta: { requestId: 'test-request-id', requestStatus: 'fulfilled' },
        });
    },
}));

describe('calculateFeeLevelsMaxAmountThunk', () => {
    const feeInfo: FeeInfo = {
        blockHeight: 0,
        blockTime: 10,
        minFee: 1,
        maxFee: 100,
        minPriorityFee: 0,
        dustLimit: 546,
        levels: [{ label: 'normal', feePerUnit: '2', blocks: 1 }],
    };

    const formState = {
        outputs: [],
        selectedFee: 'normal',
        feePerUnit: '',
        feeLimit: '',
        options: [],
    } as unknown as FormState;

    const createStore = () =>
        createStoreFromPreloadedState({
            wallet: {
                accounts: [getBtcAccount()],
                fees: { btc: { status: 'loaded', data: feeInfo } },
            },
        }) as unknown as ReduxStoreWithThunk<
            CalculateFeeLevelsMaxAmountThunkState,
            Record<never, never>
        >;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([true, false, undefined])(
        'should pass assumeNewAccount=%s to compose context and return max amounts',
        async assumeNewAccount => {
            const store = createStore();

            const result = await store.dispatch(
                calculateFeeLevelsMaxAmountThunk({
                    formState,
                    accountKey: BTC_ACCOUNT_KEY,
                    assumeNewAccount,
                }),
            );

            expect(mockComposeSendFormTransactionFeeLevelsThunk).toHaveBeenCalledWith({
                formState: { ...formState, setMaxOutputId: 0 },
                composeContext: expect.objectContaining({
                    account: expect.objectContaining({ key: BTC_ACCOUNT_KEY }),
                    assumeNewAccount,
                }),
            });
            expect(result.payload).toEqual({ normal: '0.009', economy: '0.008' });
        },
    );
});
