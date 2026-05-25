import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
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
    setAccountKey: (accountKey: AccountKey | undefined) => void;
};
describe('useSendAccountAssetBalance', () => {
    const renderUseSendAccountAssetBalance = (initialProps: HookProps) =>
        renderHookWithStoreProvider(
            ({ form, setBalance, setSendSymbol, setContractAddress, setAccountKey }) =>
                useSendAccountAssetBalance(
                    form,
                    setBalance,
                    setSendSymbol,
                    setContractAddress,
                    setAccountKey,
                ),
            {
                preloadedState: { wallet: getWalletState({ tradeType: 'sell' }) },
                initialProps,
            },
        );

    const getFormMock = (sendAccount: Account | undefined, sendAsset: TradeableAsset | undefined) =>
        ({
            watch: () => [sendAccount, sendAsset],
        }) as unknown as SellFormType;

    it('should watch for balance and asset symbol', () => {
        const setBalance = jest.fn();
        const setSendSymbol = jest.fn();
        const setContractAddress = jest.fn();
        const setAccountKey = jest.fn();
        renderUseSendAccountAssetBalance({
            form: getFormMock(getBtcAccount(), btcAsset),
            setBalance,
            setSendSymbol,
            setContractAddress,
            setAccountKey,
        });

        expect(setBalance).toHaveBeenCalledWith('0.01');
        expect(setSendSymbol).toHaveBeenCalledWith('btc');
    });

    it('should set balance to undefined when account is undefined', () => {
        const setBalance = jest.fn();
        const setSendSymbol = jest.fn();
        const setContractAddress = jest.fn();
        const setAccountKey = jest.fn();

        renderUseSendAccountAssetBalance({
            form: getFormMock(undefined, btcAsset),
            setBalance,
            setSendSymbol,
            setContractAddress,
            setAccountKey,
        });

        expect(setBalance).toHaveBeenCalledWith(undefined);
    });

    it('should set balance to undefined when symbol is undefined', () => {
        const setBalance = jest.fn();
        const setSendSymbol = jest.fn();
        const setContractAddress = jest.fn();
        const setAccountKey = jest.fn();

        renderUseSendAccountAssetBalance({
            form: getFormMock(getBtcAccount(), undefined),
            setBalance,
            setSendSymbol,
            setContractAddress,
            setAccountKey,
        });

        expect(setBalance).toHaveBeenCalledWith(undefined);
    });
});
