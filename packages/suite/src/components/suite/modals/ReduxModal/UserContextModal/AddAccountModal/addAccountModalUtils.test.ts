import { type Network, WATCH_ONLY_ACCOUNT_TYPE, getNetwork } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    enqueueNetworkActivation,
    getAddableAccountTypes,
    getSortedNetworks,
    getVisibleAccountCounts,
    hasTypeSelectionStep,
} from './addAccountModalUtils';

describe('addAccountModalUtils', () => {
    describe(getSortedNetworks.name, () => {
        it('places enabled networks first and disabled networks last.', () => {
            const result = getSortedNetworks({
                availableNetworks: [
                    getNetwork('eth'),
                    getNetwork('btc'),
                    getNetwork('sol'),
                    getNetwork('ada'),
                ],
                enabledNetworkSymbols: [getNetwork('btc').symbol, getNetwork('ada').symbol],
            });

            expect(result).toEqual([
                getNetwork('btc'),
                getNetwork('ada'),
                getNetwork('eth'),
                getNetwork('sol'),
            ]);
        });
    });

    describe(getVisibleAccountCounts.name, () => {
        it('counts only visible accounts belonging to the selected device state', () => {
            const accounts = [
                mockWalletAccount({
                    symbol: getNetwork('btc').symbol,
                    deviceState: 'state@device:0',
                    visible: true,
                }),
                mockWalletAccount({
                    symbol: getNetwork('btc').symbol,
                    deviceState: 'state@device:0',
                    visible: false,
                }),
                mockWalletAccount({
                    symbol: getNetwork('eth').symbol,
                    deviceState: 'state@device:0',
                    visible: true,
                }),
                mockWalletAccount({
                    symbol: getNetwork('btc').symbol,
                    deviceState: 'other@device:0',
                    visible: true,
                }),
            ];

            expect(getVisibleAccountCounts(accounts, 'state@device:0')).toEqual({
                btc: 1,
                eth: 1,
            });
        });
    });

    describe(enqueueNetworkActivation.name, () => {
        it('does not enqueue a network more than once', () => {
            expect(
                enqueueNetworkActivation([getNetwork('btc').symbol], getNetwork('btc').symbol),
            ).toEqual([getNetwork('btc').symbol]);
        });

        it('appends a different network without reordering the queue', () => {
            expect(
                enqueueNetworkActivation([getNetwork('btc').symbol], getNetwork('eth').symbol),
            ).toEqual([getNetwork('btc').symbol, getNetwork('eth').symbol]);
        });
    });
});

describe(getAddableAccountTypes.name, () => {
    const eth = getNetwork('eth');
    const derivedAccountTypes = [{ accountType: 'normal' as const, bip43Path: eth.bip43Path }];
    const watchOnly = { accountType: WATCH_ONLY_ACCOUNT_TYPE, bip43Path: eth.bip43Path };
    const getAccountTypes = (
        network: Network,
        { isDeviceConnected = true, isDebugModeEnabled = true } = {},
    ) =>
        getAddableAccountTypes({
            network,
            isDeviceConnected,
            isDebugModeEnabled,
            getDerivedAccountTypes: () => derivedAccountTypes,
        });

    it('appends the watch-only type to the derived ones', () => {
        expect(getAccountTypes(eth)).toEqual([...derivedAccountTypes, watchOnly]);
    });

    it('offers only the watch-only type without a connected device', () => {
        expect(getAccountTypes(eth, { isDeviceConnected: false })).toEqual([watchOnly]);
    });

    it.each(['sol', 'trx'] as const)('offers the watch-only type on %s', symbol => {
        const network = getNetwork(symbol);

        expect(getAccountTypes(network, { isDeviceConnected: false })).toEqual([
            { accountType: WATCH_ONLY_ACCOUNT_TYPE, bip43Path: network.bip43Path },
        ]);
    });

    it('offers nothing without a connected device where watching is not possible', () => {
        expect(getAccountTypes(getNetwork('btc'), { isDeviceConnected: false })).toBeUndefined();
        expect(
            getAccountTypes(eth, { isDeviceConnected: false, isDebugModeEnabled: false }),
        ).toBeUndefined();
    });

    it('leaves the watch-only type out outside debug mode', () => {
        expect(getAccountTypes(eth, { isDebugModeEnabled: false })).toEqual(derivedAccountTypes);
    });
});

describe(hasTypeSelectionStep.name, () => {
    const eth = getNetwork('eth');

    it('selects among several types, or asks for the watched address', () => {
        expect(
            hasTypeSelectionStep([
                { accountType: WATCH_ONLY_ACCOUNT_TYPE, bip43Path: eth.bip43Path },
            ]),
        ).toBe(true);
        expect(hasTypeSelectionStep([{ accountType: 'normal', bip43Path: eth.bip43Path }])).toBe(
            false,
        );
        expect(hasTypeSelectionStep(undefined)).toBe(false);
    });
});
