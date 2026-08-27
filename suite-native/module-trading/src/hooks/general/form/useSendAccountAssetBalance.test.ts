import { yup } from '@suite-common/validators';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { useForm } from '@suite-native/forms';
import { renderHookWithStoreProvider } from '@suite-native/test-utils-store';
import { btcAsset, getBtcAccount, getWalletState } from '@suite-native/trading-fixtures';
import { type SellFormValues, type TradeableAsset } from '@suite-native/trading-types';

import { useSendAccountAssetBalance } from './useSendAccountAssetBalance';

type HookProps = {
    sendAccount: Account | undefined;
    sendAsset: TradeableAsset | undefined;
    setBalance: (balance: string | undefined) => unknown;
    setSendNetworkSymbol: (networkSymbol: Account['symbol'] | undefined) => unknown;
    setSendAssetSymbol: (symbol: string | undefined) => unknown;
    setContractAddress: (contractAddress: TokenAddress | undefined) => unknown;
    setAccountKey: (accountKey: AccountKey | undefined) => void;
};
describe('useSendAccountAssetBalance', () => {
    const renderUseSendAccountAssetBalance = async (initialProps: HookProps) =>
        await renderHookWithStoreProvider(
            ({
                sendAccount,
                sendAsset,
                setBalance,
                setSendNetworkSymbol,
                setSendAssetSymbol,
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
                    setSendNetworkSymbol,
                    setSendAssetSymbol,
                    setContractAddress,
                    setAccountKey,
                });
            },
            {
                preloadedState: { wallet: getWalletState({ tradeType: 'sell' }) },
                initialProps,
            },
        );

    it('should watch for balance and asset symbol', async () => {
        const setBalance = jest.fn();
        const setSendNetworkSymbol = jest.fn();
        const setSendAssetSymbol = jest.fn();
        const setContractAddress = jest.fn();
        const setAccountKey = jest.fn();
        await renderUseSendAccountAssetBalance({
            sendAccount: getBtcAccount(),
            sendAsset: btcAsset,
            setBalance,
            setSendNetworkSymbol,
            setSendAssetSymbol,
            setContractAddress,
            setAccountKey,
        });

        expect(setBalance).toHaveBeenCalledWith('0.01');
        expect(setSendNetworkSymbol).toHaveBeenCalledWith('btc');
        expect(setSendAssetSymbol).toHaveBeenCalledWith('BTC');
    });

    it('should set balance to undefined when account is undefined', async () => {
        const setBalance = jest.fn();
        const setSendNetworkSymbol = jest.fn();
        const setSendAssetSymbol = jest.fn();
        const setContractAddress = jest.fn();
        const setAccountKey = jest.fn();

        await renderUseSendAccountAssetBalance({
            sendAccount: undefined,
            sendAsset: btcAsset,
            setBalance,
            setSendNetworkSymbol,
            setSendAssetSymbol,
            setContractAddress,
            setAccountKey,
        });

        expect(setBalance).toHaveBeenCalledWith(undefined);
    });

    it('should set balance to undefined when symbol is undefined', async () => {
        const setBalance = jest.fn();
        const setSendNetworkSymbol = jest.fn();
        const setSendAssetSymbol = jest.fn();
        const setContractAddress = jest.fn();
        const setAccountKey = jest.fn();

        await renderUseSendAccountAssetBalance({
            sendAccount: getBtcAccount(),
            sendAsset: undefined,
            setBalance,
            setSendNetworkSymbol,
            setSendAssetSymbol,
            setContractAddress,
            setAccountKey,
        });

        expect(setBalance).toHaveBeenCalledWith(undefined);
    });
});
