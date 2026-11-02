import { act } from '@testing-library/react';
import { type CryptoId } from 'invity-api';

import { mockAddressValidator } from '@suite-common/address/mocks';
import { type AddressValidatorDep } from '@suite-common/networks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { createTestCompositionRoot, renderHookWithStoreProvider } from '@suite-common/test-utils';
import { getCryptoId } from '@suite-common/trading';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import type { StaticSessionId } from '@trezor/connect';
import { type WithServices } from '@trezor/redux-utils';

import { type AppState } from 'src/reducers/store';

import { useTradingReceiveAddress } from './useTradingReceiveAddress';

const xrpSymbol = asNetworkSymbol('xrp');
const xlmSymbol = asNetworkSymbol('xlm');
const XRP_CRYPTO_ID = getCryptoId(xrpSymbol);
const XLM_CRYPTO_ID = getCryptoId(xlmSymbol);
const DEVICE_STATE: StaticSessionId = '1stTestnetAddress@device_id:0';

const EXTERNAL_ADDRESS = 'rNaqKtKrMSwpwZSzRckPf7S96DkimjkF4H';
const OTHER_EXTERNAL_ADDRESS = 'rDNvpqSzJzk8Yf6D5cFJRk7WJ8dUhKqwzT';
const DESTINATION_TAG = '12345';

const actAndSettle = (callback: () => void) =>
    act(() => {
        callback();

        return Promise.resolve();
    });

const XRP_ACCOUNT: Account = mockWalletAccount({
    symbol: xrpSymbol,
    descriptor: asAccountDescriptor('rTrezorAccount'),
    deviceState: DEVICE_STATE,
    visible: true,
});

type RenderReceiveAddressOptions = {
    accounts?: Account[];
    persistedReceiveAddress?: string;
    persistedExtraField?: string;
    isAddressValid?: boolean;
};

const renderReceiveAddress = async ({
    accounts = [XRP_ACCOUNT],
    persistedReceiveAddress,
    persistedExtraField,
    isAddressValid = true,
}: RenderReceiveAddressOptions = {}) => {
    const { services } = createTestCompositionRoot<
        WithServices<{ networks: AddressValidatorDep }>,
        AppState
    >({
        preloadedState: {
            debug: { showDebugMenu: false },
            suiteSettings: { experimental: undefined, isTestnetNetworksEnabled: false },
            device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
            networks: mockNetworksState([xrpSymbol, xlmSymbol]),
            wallet: {
                accounts,
                selectedAccount: { account: undefined },
                trading: {
                    buy: {
                        receiveAccountKey: undefined,
                        receiveAddress: persistedReceiveAddress,
                        extraField: persistedExtraField,
                    },
                    exchange: {
                        tradingAccountKey: undefined,
                        receiveAccountKey: undefined,
                        receiveAddress: undefined,
                    },
                },
            },
        },
        services: () => ({
            networks: {
                addressValidator: mockAddressValidator({ isAddressValid: () => isAddressValid }),
            },
        }),
    });

    const rendered = renderHookWithStoreProvider(
        ({ cryptoId }: { cryptoId: CryptoId }) =>
            useTradingReceiveAddress({ type: 'buy', cryptoId, nonSuiteAccount: true }),
        { services, initialProps: { cryptoId: XRP_CRYPTO_ID } },
    );
    await act(() => Promise.resolve());

    return rendered;
};

describe('useTradingReceiveAddress', () => {
    it('clears the extra field when a Trezor account replaces an external address', async () => {
        const { result } = await renderReceiveAddress();

        await actAndSettle(() =>
            result.current.selectNonSuiteAddress(EXTERNAL_ADDRESS, DESTINATION_TAG),
        );

        expect(result.current.receiveAddress).toBe(EXTERNAL_ADDRESS);
        expect(result.current.extraField).toBe(DESTINATION_TAG);

        await actAndSettle(() => result.current.onChangeAccount(XRP_ACCOUNT));

        expect(result.current.receiveAddress).toBe(XRP_ACCOUNT.descriptor);
        expect(result.current.extraField).toBeUndefined();
    });

    it('clears the extra field when a new external address comes without one', async () => {
        const { result } = await renderReceiveAddress();

        await actAndSettle(() =>
            result.current.selectNonSuiteAddress(EXTERNAL_ADDRESS, DESTINATION_TAG),
        );

        expect(result.current.extraField).toBe(DESTINATION_TAG);

        await actAndSettle(() => result.current.selectNonSuiteAddress(OTHER_EXTERNAL_ADDRESS));

        expect(result.current.receiveAddress).toBe(OTHER_EXTERNAL_ADDRESS);
        expect(result.current.extraField).toBeUndefined();
    });

    it('restores a persisted external address with its extra field when it mounts', async () => {
        const { result } = await renderReceiveAddress({
            persistedReceiveAddress: EXTERNAL_ADDRESS,
            persistedExtraField: DESTINATION_TAG,
        });

        expect(result.current.selectedAccount).toBeNull();
        expect(result.current.receiveAddress).toBe(EXTERNAL_ADDRESS);
        expect(result.current.extraField).toBe(DESTINATION_TAG);
    });

    it('restores a persisted external address when no Trezor account matches the asset', async () => {
        const { result } = await renderReceiveAddress({
            accounts: [],
            persistedReceiveAddress: EXTERNAL_ADDRESS,
            persistedExtraField: DESTINATION_TAG,
        });

        expect(result.current.receiveAddress).toBe(EXTERNAL_ADDRESS);
        expect(result.current.extraField).toBe(DESTINATION_TAG);
    });

    it('drops a persisted external address that is not valid for the asset', async () => {
        const { result } = await renderReceiveAddress({
            persistedReceiveAddress: EXTERNAL_ADDRESS,
            persistedExtraField: DESTINATION_TAG,
            isAddressValid: false,
        });

        expect(result.current.selectedAccount?.key).toBe(XRP_ACCOUNT.key);
        expect(result.current.receiveAddress).toBe(XRP_ACCOUNT.descriptor);
        expect(result.current.extraField).toBeUndefined();
    });

    it('clears the external address and the extra field when the asset changes', async () => {
        const { result, rerender } = await renderReceiveAddress({
            persistedReceiveAddress: EXTERNAL_ADDRESS,
            persistedExtraField: DESTINATION_TAG,
        });

        expect(result.current.receiveAddress).toBe(EXTERNAL_ADDRESS);

        rerender({ cryptoId: XLM_CRYPTO_ID });
        await act(() => Promise.resolve());

        expect(result.current.receiveAddress).toBeUndefined();
        expect(result.current.extraField).toBeUndefined();
    });
});
