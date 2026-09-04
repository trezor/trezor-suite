import { asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    enqueueNetworkActivation,
    getNewNetworkAccounts,
    getSortedNetworks,
    getVisibleAccountCounts,
} from './addAccountModalUtils';

const btcNetwork = getNetwork(asNetworkSymbol('btc'));
const ethNetwork = getNetwork(asNetworkSymbol('eth'));
const solNetwork = getNetwork(asNetworkSymbol('sol'));
const adaNetwork = getNetwork(asNetworkSymbol('ada'));

describe('addAccountModalUtils', () => {
    describe(getSortedNetworks.name, () => {
        it('places enabled networks first and disabled networks last.', () => {
            const result = getSortedNetworks({
                availableNetworks: [ethNetwork, btcNetwork, solNetwork, adaNetwork],
                enabledNetworkSymbols: [btcNetwork.symbol, adaNetwork.symbol],
            });

            expect(result).toEqual([btcNetwork, adaNetwork, ethNetwork, solNetwork]);
        });
    });

    describe(getVisibleAccountCounts.name, () => {
        it('counts only visible accounts belonging to the selected device state', () => {
            const accounts = [
                mockWalletAccount({
                    symbol: btcNetwork.symbol,
                    deviceState: 'state@device:0',
                    visible: true,
                }),
                mockWalletAccount({
                    symbol: btcNetwork.symbol,
                    deviceState: 'state@device:0',
                    visible: false,
                }),
                mockWalletAccount({
                    symbol: ethNetwork.symbol,
                    deviceState: 'state@device:0',
                    visible: true,
                }),
                mockWalletAccount({
                    symbol: btcNetwork.symbol,
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
            expect(enqueueNetworkActivation([btcNetwork.symbol], btcNetwork.symbol)).toEqual([
                btcNetwork.symbol,
            ]);
        });

        it('appends a different network without reordering the queue', () => {
            expect(enqueueNetworkActivation([btcNetwork.symbol], ethNetwork.symbol)).toEqual([
                btcNetwork.symbol,
                ethNetwork.symbol,
            ]);
        });
    });

    describe(getNewNetworkAccounts.name, () => {
        it('returns only accounts created for the activated network after discovery started', () => {
            const existingAccount = mockWalletAccount({
                descriptor: asAccountDescriptor('existingAccount'),
                symbol: btcNetwork.symbol,
            });
            const newBitcoinAccount = mockWalletAccount({
                descriptor: asAccountDescriptor('newBitcoinAccount'),
                symbol: btcNetwork.symbol,
            });
            const newEthereumAccount = mockWalletAccount({
                descriptor: asAccountDescriptor('newEthereumAccount'),
                symbol: ethNetwork.symbol,
            });

            expect(
                getNewNetworkAccounts({
                    accounts: [existingAccount, newBitcoinAccount, newEthereumAccount],
                    existingAccountKeys: new Set([existingAccount.key]),
                    networkSymbol: btcNetwork.symbol,
                }),
            ).toEqual([newBitcoinAccount]);
        });
    });
});
