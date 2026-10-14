import { asNetworkSymbol } from '@suite-common/wallet-config';
import { DEFAULT_VALUES } from '@suite-common/wallet-constants';
import { type FeeInfo, type FormState } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { mock } from '@trezor/dependency-injection';

import { getTradingNetworkFeeEdit } from './getTradingNetworkFeeEdit';

const ethAccount = mockWalletAccount({ symbol: asNetworkSymbol('eth') });
const solAccount = mockWalletAccount({ symbol: asNetworkSymbol('sol') });

const feeInfo: FeeInfo = {
    blockHeight: 890366,
    blockTime: 10,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    dustLimit: 546,
    levels: [{ label: 'normal', feePerUnit: '2', blocks: 2 }],
};
const composeFormState: FormState = {
    ...DEFAULT_VALUES,
    outputs: [],
    options: ['broadcast'],
    selectedUtxos: [],
    selectedFee: 'normal',
};
const onConfirm = mock<Parameters<typeof getTradingNetworkFeeEdit>[0]['onConfirm']>();

describe('getTradingNetworkFeeEdit', () => {
    it('offers the edit with the compose inputs on an adjustable network', () => {
        expect(
            getTradingNetworkFeeEdit({
                account: ethAccount,
                feeInfo,
                composeFormState,
                onConfirm,
                isTokenTransfer: false,
            }),
        ).toEqual({ account: ethAccount, feeInfo, composeFormState, onConfirm });
    });

    it('passes the new account assumption to the edit', () => {
        expect(
            getTradingNetworkFeeEdit({
                account: ethAccount,
                feeInfo,
                composeFormState,
                assumeNewAccount: true,
                onConfirm,
                isTokenTransfer: false,
            }),
        ).toEqual({
            account: ethAccount,
            feeInfo,
            composeFormState,
            assumeNewAccount: true,
            onConfirm,
        });
    });

    it.each([
        [
            'the provider fixes the fee',
            { account: ethAccount, feeInfo, composeFormState, hasFixedFee: true },
        ],
        ['the network has no adjustable fees', { account: solAccount, feeInfo, composeFormState }],
        ['the fee info is not loaded', { account: ethAccount, feeInfo: null, composeFormState }],
        ['nothing is composed yet', { account: ethAccount, feeInfo, composeFormState: undefined }],
    ])('offers no edit when %s', (_, params) => {
        expect(
            getTradingNetworkFeeEdit({ ...params, onConfirm, isTokenTransfer: false }),
        ).toBeUndefined();
    });
});
