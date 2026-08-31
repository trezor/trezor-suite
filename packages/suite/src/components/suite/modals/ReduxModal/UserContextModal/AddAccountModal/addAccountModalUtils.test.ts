import { networks } from '@suite-common/wallet-config';
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
                availableNetworks: [networks.eth, networks.btc, networks.sol, networks.ada],
                enabledNetworkSymbols: [networks.btc.symbol, networks.ada.symbol],
            });

            expect(result).toEqual([networks.btc, networks.ada, networks.eth, networks.sol]);
        });
    });

    describe(getVisibleAccountCounts.name, () => {
        it('counts only visible accounts belonging to the selected device state', () => {
            const accounts = [
                mockWalletAccount({
                    symbol: networks.btc.symbol,
                    deviceState: 'state@device:0',
                    visible: true,
                }),
                mockWalletAccount({
                    symbol: networks.btc.symbol,
                    deviceState: 'state@device:0',
                    visible: false,
                }),
                mockWalletAccount({
                    symbol: networks.eth.symbol,
                    deviceState: 'state@device:0',
                    visible: true,
                }),
                mockWalletAccount({
                    symbol: networks.btc.symbol,
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
            expect(enqueueNetworkActivation([networks.btc.symbol], networks.btc.symbol)).toEqual([
                networks.btc.symbol,
            ]);
        });

        it('appends a different network without reordering the queue', () => {
            expect(enqueueNetworkActivation([networks.btc.symbol], networks.eth.symbol)).toEqual([
                networks.btc.symbol,
                networks.eth.symbol,
            ]);
        });
    });
});
