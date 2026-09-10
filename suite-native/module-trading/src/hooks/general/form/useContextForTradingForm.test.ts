import { type TradingAmountLimitProps } from '@suite-common/trading';
import { type TokenAddress } from '@suite-common/wallet-types';
import { act } from '@suite-native/test-utils-store';
import { useMaxSpendableAmount } from '@suite-native/transaction-management';
import { PROTO } from '@trezor/connect';

import { useContextForTradingForm } from './useContextForTradingForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

jest.mock('@suite-native/transaction-management', () => ({
    useMaxSpendableAmount: jest.fn(() => ({ maxSpendableAmount: undefined })),
}));

describe('useContextForTradingForm', () => {
    beforeEach(() => {
        jest.mocked(useMaxSpendableAmount).mockReturnValue({ maxSpendableAmount: undefined });
    });

    const renderUseContextForTradingForm = async (
        limits: TradingAmountLimitProps | undefined,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderHookWithTradingProvider(() => useContextForTradingForm(limits), {
            overrides,
        });

    it('should return base context without limits and balance on initial render', async () => {
        const { result } = await renderUseContextForTradingForm(undefined, {
            wallet: { settings: { networkReserve: true } },
        });

        expect(result.current.context).toEqual({
            translate: expect.any(Function),
            FiatAmountFormatter: expect.any(Function),
            CryptoAmountFormatter: expect.any(Function),
            convertNumberToBaseUnit: expect.any(Function),
            isNetworkReserveEnabled: true,
        });
    });

    it.each([
        [PROTO.AmountUnit.BITCOIN, '0.01'],
        [PROTO.AmountUnit.SATOSHI, '1000000'],
    ])(
        'normalizes the BTC maximum with amount unit %s',
        async (bitcoinAmountUnit, maxSpendableAmount) => {
            jest.mocked(useMaxSpendableAmount).mockReturnValue({ maxSpendableAmount });
            const { result } = await renderUseContextForTradingForm(undefined, {
                wallet: { settings: { bitcoinAmountUnit } },
            });

            await act(() => result.current.setSendNetworkSymbol('btc'));

            expect(result.current.context.maxSpendableAmount).toBe('0.01');
        },
    );

    it('exposes a disabled reserve setting and preserves an unavailable maximum', async () => {
        const { result } = await renderUseContextForTradingForm(undefined, {
            wallet: { settings: { networkReserve: false } },
        });

        await act(() => result.current.setSendNetworkSymbol('btc'));

        expect(result.current.context.isNetworkReserveEnabled).toBe(false);
        expect(result.current.context.maxSpendableAmount).toBeUndefined();
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
            result.current.setSendNetworkSymbol('eth');
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
});
