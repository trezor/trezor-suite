import { type TradingAmountLimitProps } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';
import { act } from '@suite-native/test-utils-store';

import { useContextForTradingForm } from './useContextForTradingForm';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

const ethSymbol = asNetworkSymbol('eth');

describe('useContextForTradingForm', () => {
    const renderUseContextForTradingForm = async (
        limits: TradingAmountLimitProps | undefined,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = {},
    ) =>
        await renderHookWithTradingProvider(() => useContextForTradingForm(limits), {
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
            result.current.setSendNetworkSymbol(ethSymbol);
            result.current.setSendAssetSymbol('USDT');
            result.current.setContractAddress('0x123' as TokenAddress);
        });

        expect(result.current.context).toEqual(
            expect.objectContaining({
                balance: '0.5',
                sendNetworkSymbol: ethSymbol,
                sendAssetSymbol: 'USDT',
                contractAddress: '0x123',
            }),
        );
    });
});
