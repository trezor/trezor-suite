import { act } from '@testing-library/react';

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
const XRP_CRYPTO_ID = getCryptoId(xrpSymbol);
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

const renderReceiveAddress = async () => {
    const { services } = createTestCompositionRoot<
        WithServices<{ networks: AddressValidatorDep }>,
        AppState
    >({
        preloadedState: {
            debug: { showDebugMenu: false },
            suiteSettings: { experimental: undefined, isTestnetNetworksEnabled: false },
            device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
            networks: mockNetworksState([xrpSymbol]),
            wallet: {
                accounts: [XRP_ACCOUNT],
                selectedAccount: { account: undefined },
                trading: {
                    buy: { receiveAccountKey: undefined, receiveAddress: undefined },
                    exchange: {
                        tradingAccountKey: undefined,
                        receiveAccountKey: undefined,
                        receiveAddress: undefined,
                    },
                },
            },
        },
        services: () => ({
            networks: { addressValidator: mockAddressValidator({ isAddressValid: () => true }) },
        }),
    });

    const rendered = renderHookWithStoreProvider(
        () =>
            useTradingReceiveAddress({
                type: 'buy',
                cryptoId: XRP_CRYPTO_ID,
                nonSuiteAccount: true,
            }),
        { services },
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
});
