import {
    composeSendFormTransactionFeeLevelsThunk,
    selectAccountByKey,
    selectConvertedNetworkFeeInfo,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import { type FeeInfo, type TokenAddress } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';
import { createStoreFromPreloadedState } from '@suite-native/test-utils-store';

import { composeStellarTrustlineFeesThunk } from './thunks';

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountByKey: jest.fn(),
    selectConvertedNetworkFeeInfo: jest.fn(),
    updateFeeInfoThunk: jest.fn(),
    composeSendFormTransactionFeeLevelsThunk: jest.fn(),
}));

const accountKey = mockAccountKey({ symbol: 'xlm', descriptor: 'stellar1' });
const tokenContract =
    'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN' as TokenAddress;

const mockAccount = {
    key: accountKey,
    symbol: 'xlm',
    networkType: 'stellar',
    descriptor: 'GAXSFOOGF4ELO5HT5PTN23T5XE6D5QWL3YBHSVQ2HWOFEJNYYMRJENBV',
    availableBalance: '10000000000',
    tokens: [],
};

const backendFeeInfo: FeeInfo = {
    blockHeight: 0,
    blockTime: -1,
    minFee: 100,
    maxFee: 10000000,
    minPriorityFee: -1,
    levels: [{ label: 'normal', feePerUnit: '150', blocks: -1 }],
};

const emptyFeeInfo: FeeInfo = { ...backendFeeInfo, levels: [] };

const composedLevels = { normal: { type: 'final', feePerByte: '150' } };

const getComposeContext = () =>
    jest.mocked(composeSendFormTransactionFeeLevelsThunk).mock.calls[0]?.[0].composeContext;

describe('composeStellarTrustlineFeesThunk', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        jest.mocked(selectAccountByKey).mockReturnValue(mockAccount as any);
        jest.mocked(updateFeeInfoThunk).mockImplementation((() => ({
            type: 'fees/updateFeeInfoThunk',
        })) as any);
        jest.mocked(composeSendFormTransactionFeeLevelsThunk).mockImplementation((() => ({
            type: 'send/composeSendFormTransactionThunk/fulfilled',
            payload: composedLevels,
            meta: { requestStatus: 'fulfilled', requestId: 'compose', arg: undefined },
        })) as any);
    });

    const dispatchThunk = () => {
        const store = createStoreFromPreloadedState();

        return store.dispatch(
            composeStellarTrustlineFeesThunk({ accountKey, tokenContract }) as any,
        );
    };

    it('composes with the fee info from the store without refetching it', async () => {
        jest.mocked(selectConvertedNetworkFeeInfo).mockReturnValue(backendFeeInfo);

        const result = await dispatchThunk();

        expect(updateFeeInfoThunk).not.toHaveBeenCalled();
        expect(getComposeContext()?.feeInfo).toBe(backendFeeInfo);
        expect(result.payload).toEqual(composedLevels);
    });

    it('fetches the fee info when it is missing from the store', async () => {
        jest.mocked(selectConvertedNetworkFeeInfo)
            .mockReturnValueOnce(null)
            .mockReturnValueOnce(backendFeeInfo);

        const result = await dispatchThunk();

        expect(updateFeeInfoThunk).toHaveBeenCalledWith({ networkSymbol: 'xlm' });
        expect(getComposeContext()?.feeInfo).toBe(backendFeeInfo);
        expect(result.payload).toEqual(composedLevels);
    });

    it('does not compose when the fee info stays unavailable after the fetch', async () => {
        jest.mocked(selectConvertedNetworkFeeInfo).mockReturnValue(emptyFeeInfo);

        const result = await dispatchThunk();

        expect(updateFeeInfoThunk).toHaveBeenCalledWith({ networkSymbol: 'xlm' });
        expect(composeSendFormTransactionFeeLevelsThunk).not.toHaveBeenCalled();
        expect(result.payload).toBe('Fee info not available');
    });
});
