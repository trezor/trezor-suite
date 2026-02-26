import { Account } from '@suite-common/wallet-types';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils/store';
import { btcAsset, getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';
import { ExchangeFormType, SellFormType, TradeableAsset } from '@suite-native/trading-types';

import { useSendAccountAssetBalance } from '../useSendAccountAssetBalance';

type HookProps = {
    form: ExchangeFormType | SellFormType;
    setBalance: (balance: string | undefined) => unknown;
    setSendSymbol: (currency: string | undefined) => unknown;
};
describe('useSendAccountAssetBalance', () => {
    const renderUseSendAccountAssetBalance = (initialProps: HookProps) =>
        renderHookWithStoreProviderAsync(
            ({ form, setBalance, setSendSymbol }) =>
                useSendAccountAssetBalance(form, setBalance, setSendSymbol),
            {
                preloadedState: { wallet: getWalletState({ tradeType: 'sell' }) },
                initialProps,
            },
        );

    const getFormMock = (sendAccount: Account | undefined, sendAsset: TradeableAsset | undefined) =>
        ({
            watch: () => [sendAccount, sendAsset],
        }) as unknown as SellFormType;

    it('should watch for balance and asset symbol', async () => {
        const setBalance = jest.fn();
        const setSendSymbol = jest.fn();

        await renderUseSendAccountAssetBalance({
            form: getFormMock(getBtcAccount(), btcAsset),
            setBalance,
            setSendSymbol,
        });

        expect(setBalance).toHaveBeenCalledWith('0.01');
        expect(setSendSymbol).toHaveBeenCalledWith('BTC');
    });

    it('should set balance to undefined when account is undefined', async () => {
        const setBalance = jest.fn();
        const setSendSymbol = jest.fn();

        await renderUseSendAccountAssetBalance({
            form: getFormMock(undefined, btcAsset),
            setBalance,
            setSendSymbol,
        });

        expect(setBalance).toHaveBeenCalledWith(undefined);
    });

    it('should set balance to undefined when symbol is undefined', async () => {
        const setBalance = jest.fn();
        const setSendSymbol = jest.fn();

        await renderUseSendAccountAssetBalance({
            form: getFormMock(getBtcAccount(), undefined),
            setBalance,
            setSendSymbol,
        });

        expect(setBalance).toHaveBeenCalledWith(undefined);
    });
});
