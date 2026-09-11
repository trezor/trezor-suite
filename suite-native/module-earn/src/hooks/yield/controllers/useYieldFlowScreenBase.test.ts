import { getYieldVaultContractAddress } from '@suite-common/wallet-core';
import { mockResolvedYieldFlowData, mockYieldSessionState } from '@suite-common/wallet-core/mocks';
import { type AccountKey, toTokenAddress } from '@suite-common/wallet-types';
import { type YieldFlowParams } from '@suite-native/navigation';
import { renderHookWithBasicProvider } from '@suite-native/test-utils';

import { useYieldFlowScreenBase } from './useYieldFlowScreenBase';
import { useMessageSystemYield } from '../useMessageSystemYield';
import { useYieldFlowData } from '../useYieldFlowData';
import { useYieldSession } from '../useYieldSession';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useIsFocused: () => true,
}));
jest.mock('../useYieldFlowData');
jest.mock('../useMessageSystemYield');
jest.mock('../useShowYieldTransactionFailureAlert');
jest.mock('../useYieldSession');

const useYieldFlowDataMock = jest.mocked(useYieldFlowData);
const useMessageSystemYieldMock = jest.mocked(useMessageSystemYield);
const useYieldSessionMock = jest.mocked(useYieldSession);

const routeParams: YieldFlowParams = {
    accountKey: 'account-key' as AccountKey,
    tokenContract: toTokenAddress('0xtoken'),
};

const yieldFlowData = mockResolvedYieldFlowData();
const vaultContractAddress = getYieldVaultContractAddress(yieldFlowData.vault);

const session = mockYieldSessionState({ error: 'TR_EARN_YIELD_ERROR_GENERIC' });

describe('useYieldFlowScreenBase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useYieldFlowDataMock.mockReturnValue(yieldFlowData);
        useMessageSystemYieldMock.mockReturnValue({
            isDisabled: false,
            content: undefined,
            variant: undefined,
        });
        useYieldSessionMock.mockReturnValue(session);
    });

    it('keeps the withdraw message-system key for the redeem flow', async () => {
        await renderHookWithBasicProvider(() =>
            useYieldFlowScreenBase({
                flowType: 'redeem',
                messageSystemType: 'withdraw',
                routeParams,
            }),
        );

        expect(useYieldSessionMock).toHaveBeenCalledWith(
            expect.objectContaining({ flowType: 'redeem' }),
        );
        expect(useMessageSystemYieldMock).toHaveBeenCalledWith('withdraw', {
            vaultContractAddress,
        });
    });
});
