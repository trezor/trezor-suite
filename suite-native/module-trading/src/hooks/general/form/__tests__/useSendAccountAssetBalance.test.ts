import { yup } from '@suite-common/validators';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { useForm } from '@suite-native/forms';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { btcAsset, getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';
import { type SellFormValues, type TradeableAsset } from '@suite-native/trading-types';

import { useSendAccountAssetBalance } from '../useSendAccountAssetBalance';

type HookProps = {
    sendAccount: Account | undefined;
    sendAsset: TradeableAsset | undefined;
    setBalance: (balance: string | undefined) => unknown;
    setSendSymbol: (currency: string | undefined) => unknown;
    setContractAddress: (contractAddress: TokenAddress | undefined) => unknown;
    setAccountKey: (accountKey: AccountKey | undefined) => void;
};
describe('useSendAccountAssetBalance', () => {
    const renderUseSendAccountAssetBalance = (initialProps: HookProps) =>
        renderHookWithStoreProvider(
            ({
                sendAccount,
                sendAsset,
                setBalance,
                setSendSymbol,
                setContractAddress,
                setAccountKey,
            }) => {
                const form = useForm<SellFormValues>({
                    defaultValues: { sendAccount, sendAsset },
                    validation: yup.object({}),
                });
                useSendAccountAssetBalance({
                    control: form.control,
                    setBalance,
                    setSendSymbol,
                    setContractAddress,
                    setAccountKey,
                });
            },
            {
                preloadedState: { wallet: getWalletState({ tradeType: 'sell' }) },
                initialProps,
            },
        );

    it('should watch for balance and asset symbol', () => {
        const setBalance = jest.fn();
        const setSendSymbol = jest.fn();
        const setContractAddress = jest.fn();
        const setAccountKey = jest.fn();
        renderUseSendAccountAssetBalance({
            sendAccount: getBtcAccount(),
            sendAsset: btcAsset,
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
            sendAccount: undefined,
            sendAsset: btcAsset,
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
            sendAccount: getBtcAccount(),
            sendAsset: undefined,
            setBalance,
            setSendSymbol,
            setContractAddress,
            setAccountKey,
        });

        expect(setBalance).toHaveBeenCalledWith(undefined);
    });
});
