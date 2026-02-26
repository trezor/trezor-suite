import { TradingAmountLimitProps } from '@suite-common/trading';
import { act } from '@suite-native/test-utils';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderHookWithStoreProviderAsync } from '@suite-native/test-utils/store';

import { useContextForTradingForm } from '../useContextForTradingForm';

describe('useContextForTradingForm', () => {
    const renderUseContextForTradingForm = (
        limits: TradingAmountLimitProps | undefined,
        preloadedState: PreloadedState = {},
    ) =>
        renderHookWithStoreProviderAsync(() => useContextForTradingForm(limits), {
            preloadedState,
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

    it('should append balance and sendSymbol when specified', async () => {
        const { result } = await renderUseContextForTradingForm(undefined);

        act(() => {
            result.current.setBalance('0.5');
            result.current.setSendSymbol('ETH');
        });

        expect(result.current.context).toEqual(
            expect.objectContaining({
                balance: '0.5',
                sendSymbol: 'ETH',
            }),
        );
    });
});
