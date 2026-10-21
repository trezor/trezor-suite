import type { CryptoId } from 'invity-api';

import { getUnusedAddressFromAccount, tradingExchangeActions } from '@suite-common/trading';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep, events } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { useForm, yup } from '@suite-native/forms';
import { act, screen } from '@suite-native/test-utils-store';
import { btcAsset, ethAsset, usdcAsset } from '@suite-native/trading-fixtures';
import { tradingActions } from '@suite-native/trading-state';
import { type ExchangeFormValues } from '@suite-native/trading-types';

import { useExchangeAssetsSwitch } from './useExchangeAssetsSwitch';
import {
    createTradingTestStore,
    renderHookWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

const reportMock = jest.fn();
const services: NativeAnalyticsDep = {
    analytics: mockNativeAnalytics(reportMock),
};

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');
const btcAccount = mockWalletAccount({
    symbol: btcSymbol,
    descriptor: asAccountDescriptor('btcAccount'),
});
const ethAccount = mockWalletAccount({
    symbol: ethSymbol,
    descriptor: asAccountDescriptor('ethAccount'),
});

type FormValues = Partial<
    Pick<
        ExchangeFormValues,
        'sendAsset' | 'sendAccount' | 'receiveAsset' | 'receiveAccount' | 'receiveCryptoAmount'
    >
>;

type RenderAssetsSwitchParams = {
    values?: FormValues;
    enabledNetworkSymbols?: NetworkSymbol[];
    sellCryptoIds?: CryptoId[];
};

const SWITCHABLE_VALUES: FormValues = {
    sendAsset: btcAsset,
    sendAccount: btcAccount,
    receiveAsset: ethAsset,
    receiveAccount: { account: ethAccount },
};

const renderAssetsSwitch = async ({
    values = SWITCHABLE_VALUES,
    enabledNetworkSymbols = [btcSymbol, ethSymbol],
    sellCryptoIds,
}: RenderAssetsSwitchParams = {}) => {
    const store = createTradingTestStore({
        tradeType: 'exchange',
        overrides: {
            wallet: {
                settings: { enabledNetworks: enabledNetworkSymbols },
                ...(sellCryptoIds && {
                    trading: { exchange: { exchangeInfo: { sellCryptoIds } } },
                }),
            },
        },
    });
    const dispatchSpy = jest.spyOn(store, 'dispatch');

    const rendered = await renderHookWithTradingProvider(
        () => {
            const form = useForm<ExchangeFormValues>({ validation: yup.object({}) });

            return { form, ...useExchangeAssetsSwitch(form) };
        },
        { services: { ...services, store } },
    );

    await act(() => {
        const { form } = rendered.result.current;
        form.setValue('sendAsset', values.sendAsset);
        form.setValue('sendAccount', values.sendAccount);
        form.setValue('receiveAsset', values.receiveAsset);
        form.setValue('receiveAccount', values.receiveAccount);
        form.setValue('receiveCryptoAmount', values.receiveCryptoAmount);
    });
    dispatchSpy.mockClear();
    reportMock.mockClear();

    return { ...rendered, dispatchSpy };
};

describe('useExchangeAssetsSwitch', () => {
    afterEach(async () => {
        await screen.unmount();
    });

    it('switches the assets and keeps each one on its account', async () => {
        const { result, dispatchSpy } = await renderAssetsSwitch();

        expect(result.current.canSwitch).toBe(true);

        await act(() => {
            result.current.switchAssets();
        });

        expect(result.current.form.getValues('sendAsset')).toEqual(ethAsset);
        expect(result.current.form.getValues('receiveAsset')).toEqual(btcAsset);
        expect(dispatchSpy).toHaveBeenCalledWith(
            tradingExchangeActions.setTradingAccountKey(ethAccount.key),
        );
        expect(dispatchSpy).toHaveBeenCalledWith(
            tradingActions.setReceiveAccount({
                tradingType: 'exchange',
                accountKey: btcAccount.key,
                address: getUnusedAddressFromAccount(btcAccount).address,
            }),
        );
    });

    it('moves the quoted receive amount into the pay amount', async () => {
        const { result } = await renderAssetsSwitch({
            values: { ...SWITCHABLE_VALUES, receiveCryptoAmount: '0.5' },
        });

        await act(() => {
            result.current.switchAssets();
        });

        expect(result.current.form.getValues('sendCryptoAmount')).toBe('0.5');
        expect(result.current.form.getValues('sendBaseCurrencyAmount')).toBeUndefined();
    });

    it('keeps the typed pay amount when there is no quoted amount', async () => {
        const { result } = await renderAssetsSwitch();
        await act(() => {
            result.current.form.setValue('sendCryptoAmount', '1');
        });

        await act(() => {
            result.current.switchAssets();
        });

        expect(result.current.form.getValues('sendCryptoAmount')).toBe('1');
    });

    it('reports each side of the switch once', async () => {
        const { result } = await renderAssetsSwitch();

        await act(() => {
            result.current.switchAssets();
        });

        expect(reportMock).toHaveBeenCalledTimes(2);
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: { type: 'exchange', parameter: 'cryptoFrom' },
        });
        expect(reportMock).toHaveBeenCalledWith({
            type: events.tradingParameterChangedEvent.name,
            payload: { type: 'exchange', parameter: 'cryptoTo' },
        });
    });

    it('moves the pay asset to the receive side and leaves the pay side empty on a disabled network', async () => {
        const { result, dispatchSpy } = await renderAssetsSwitch({
            values: { ...SWITCHABLE_VALUES, receiveAccount: undefined },
            enabledNetworkSymbols: [btcSymbol],
        });

        expect(result.current.canSwitch).toBe(true);
        expect(result.current.isReceiveNetworkEnabled).toBe(false);

        await act(() => {
            result.current.switchAssets();
        });

        expect(result.current.form.getValues('receiveAsset')).toEqual(btcAsset);
        expect(result.current.form.getValues('sendAsset')).toBeUndefined();
        expect(dispatchSpy).toHaveBeenCalledWith(
            tradingExchangeActions.setTradingAccountKey(undefined),
        );
        expect(dispatchSpy).toHaveBeenCalledWith(
            tradingActions.setReceiveAccount({
                tradingType: 'exchange',
                accountKey: btcAccount.key,
                address: getUnusedAddressFromAccount(btcAccount).address,
            }),
        );
    });

    it('treats the network of a token as the receive network', async () => {
        const { result } = await renderAssetsSwitch({
            values: { ...SWITCHABLE_VALUES, receiveAsset: usdcAsset },
        });

        expect(result.current.isReceiveNetworkEnabled).toBe(true);
        expect(result.current.canSwitch).toBe(true);
    });

    it('does not allow the switch when the receive asset cannot be paid with', async () => {
        const { result } = await renderAssetsSwitch({ sellCryptoIds: [btcAsset.cryptoId] });

        expect(result.current.canSwitch).toBe(false);
    });

    it('does not allow the switch on an enabled network without a receive account', async () => {
        const { result } = await renderAssetsSwitch({
            values: { ...SWITCHABLE_VALUES, receiveAccount: undefined },
        });

        expect(result.current.canSwitch).toBe(false);
    });

    it('does not allow the switch without a receive asset', async () => {
        const { result } = await renderAssetsSwitch({
            values: { ...SWITCHABLE_VALUES, receiveAsset: undefined },
        });

        expect(result.current.canSwitch).toBe(false);
    });
});
