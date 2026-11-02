import { type TradingAmountLimitProps } from '@suite-common/trading';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT } from '@suite-common/wallet-constants';
import { type TokenAddress } from '@suite-common/wallet-types';
import { act } from '@suite-native/test-utils-store';

import { useContextForTradingForm } from './useContextForTradingForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

const mockUseMaxSpendableAmount = jest.fn();

jest.mock('@suite-native/transaction-management', () => ({
    ...jest.requireActual('@suite-native/transaction-management'),
    useMaxSpendableAmount: (...args: unknown[]) => mockUseMaxSpendableAmount(...args),
}));

describe('useContextForTradingForm', () => {
    beforeEach(() => {
        mockUseMaxSpendableAmount.mockReset().mockReturnValue({ maxSpendableAmount: undefined });
    });

    const renderUseContextForTradingForm = (
        limits: TradingAmountLimitProps | undefined,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
        options?: Parameters<typeof useContextForTradingForm>[1],
    ) =>
        renderHookWithTradingProvider(() => useContextForTradingForm(limits, options), {
            overrides,
        });

    it('should return base context without limits and balance on initial render', async () => {
        const { result } = await renderUseContextForTradingForm(undefined);

        expect(result.current.context).toEqual({
            translate: expect.any(Function),
            FiatAmountFormatter: expect.any(Function),
            CryptoAmountFormatter: expect.any(Function),
            convertNumberToBaseUnit: expect.any(Function),
        });
    });

    it('should append limits to context when specified', async () => {
        const limits: TradingAmountLimitProps = {
            minCrypto: '0.0001',
            maxCrypto: '1',
            minFiat: '10',
            maxFiat: '1000',
            currency: 'BTC',
        };

        const { result } = await renderUseContextForTradingForm(limits);

        expect(result.current.context).toEqual(expect.objectContaining(limits));
    });

    it('should append send asset data and balance when specified', async () => {
        const { result } = await renderUseContextForTradingForm(undefined);

        await act(() => {
            result.current.setBalance('0.5');
            result.current.setSendNetworkSymbol(asNetworkSymbol('eth'));
            result.current.setSendAssetSymbol('USDT');
            result.current.setContractAddress('0x123' as TokenAddress);
        });

        expect(result.current.context).toEqual(
            expect.objectContaining({
                balance: '0.5',
                sendNetworkSymbol: 'eth',
                sendAssetSymbol: 'USDT',
                contractAddress: '0x123',
            }),
        );
    });

    it.each<[string, NetworkSymbol, TokenAddress | undefined, boolean, string | undefined]>([
        [
            'reserve contract call gas for EVM native coin',
            asNetworkSymbol('eth'),
            undefined,
            true,
            ETH_CONTRACT_CALL_BACKUP_GAS_LIMIT,
        ],
        [
            'not reserve contract call gas for EVM token',
            asNetworkSymbol('eth'),
            '0x123' as TokenAddress,
            true,
            undefined,
        ],
        [
            'not reserve contract call gas for non-EVM coin',
            asNetworkSymbol('btc'),
            undefined,
            true,
            undefined,
        ],
        [
            'not reserve contract call gas when not requested',
            asNetworkSymbol('eth'),
            undefined,
            false,
            undefined,
        ],
    ])(
        'should %s',
        async (_, symbol, contractAddress, shouldReserveContractCallGas, ethereumFixedGasLimit) => {
            const { result } = await renderUseContextForTradingForm(
                undefined,
                {},
                {
                    shouldReserveContractCallGas,
                },
            );

            await act(() => {
                result.current.setSendNetworkSymbol(symbol);
                result.current.setContractAddress(contractAddress);
            });

            expect(mockUseMaxSpendableAmount).toHaveBeenLastCalledWith(
                expect.objectContaining({ symbol, ethereumFixedGasLimit }),
            );
        },
    );
});
