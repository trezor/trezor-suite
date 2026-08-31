import { getNetwork } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    enqueueNetworkActivation,
    getSortedNetworks,
    getVisibleAccountCounts,
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
