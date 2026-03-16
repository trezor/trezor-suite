import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { renderHookWithStoreProviderAsync } from '@suite-native/test-utils';
import { btcAsset, getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';
import {
    type ExchangeFormType,
    type SellFormType,
    type TradeableAsset,
} from '@suite-native/trading-types';

import { useSendAccountAssetBalance } from '../useSendAccountAssetBalance';

type HookProps = {
    form: ExchangeFormType | SellFormType;
    setBalance: (balance: string | undefined) => unknown;
    setSendSymbol: (currency: string | undefined) => unknown;
    setContractAddress: (contractAddress: TokenAddress | undefined) => unknown;
};
describe('useSendAccountAssetBalance', () => {
    const renderUseSendAccountAssetBalance = (initialProps: HookProps) =>
        renderHookWithStoreProviderAsync(
            ({ form, setBalance, setSendSymbol, setContractAddress }) =>
                useSendAccountAssetBalance(form, setBalance, setSendSymbol, setContractAddress),
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
        const setContractAddress = jest.fn();

        await renderUseSendAccountAssetBalance({
            form: getFormMock(getBtcAccount(), btcAsset),
            setBalance,
            setSendSymbol,
            setContractAddress,
        });

        expect(setBalance).toHaveBeenCalledWith('0.01');
        expect(setSendSymbol).toHaveBeenCalledWith('btc');
    });

    it('should set balance to undefined when account is undefined', async () => {
        const setBalance = jest.fn();
        const setSendSymbol = jest.fn();
        const setContractAddress = jest.fn();

        await renderUseSendAccountAssetBalance({
            form: getFormMock(undefined, btcAsset),
            setBalance,
            setSendSymbol,
            setContractAddress,
        });

        expect(setBalance).toHaveBeenCalledWith(undefined);
    });

    it('should set balance to undefined when symbol is undefined', async () => {
        const setBalance = jest.fn();
        const setSendSymbol = jest.fn();
        const setContractAddress = jest.fn();

        await renderUseSendAccountAssetBalance({
            form: getFormMock(getBtcAccount(), undefined),
            setBalance,
            setSendSymbol,
            setContractAddress,
        });

        expect(setBalance).toHaveBeenCalledWith(undefined);
    });
});
