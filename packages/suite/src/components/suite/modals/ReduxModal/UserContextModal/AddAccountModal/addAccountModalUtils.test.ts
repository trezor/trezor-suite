import { mockNetworkConfigDeps } from '@suite-common/networks/mocks';
import { getNetwork } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    enqueueNetworkActivation,
    getNewNetworkAccounts,
    getSortedNetworks,
    getVisibleAccountCounts,
} from './addAccountModalUtils';

const networkConfigDeps = mockNetworkConfigDeps();

describe('addAccountModalUtils', () => {
    describe(getSortedNetworks.name, () => {
        it('places enabled networks first and disabled networks last.', () => {
            const result = getSortedNetworks({
                availableNetworks: [
                    getNetwork(networkConfigDeps, 'eth'),
                    getNetwork(networkConfigDeps, 'btc'),
                    getNetwork(networkConfigDeps, 'sol'),
                    getNetwork(networkConfigDeps, 'ada'),
                ],
                enabledNetworkSymbols: [
                    getNetwork(networkConfigDeps, 'btc').symbol,
                    getNetwork(networkConfigDeps, 'ada').symbol,
                ],
            });

            expect(result).toEqual([
                getNetwork(networkConfigDeps, 'btc'),
                getNetwork(networkConfigDeps, 'ada'),
                getNetwork(networkConfigDeps, 'eth'),
                getNetwork(networkConfigDeps, 'sol'),
            ]);
        });
    });

    describe(getVisibleAccountCounts.name, () => {
        it('counts only visible accounts belonging to the selected device state', () => {
            const accounts = [
                mockWalletAccount({
                    symbol: getNetwork(networkConfigDeps, 'btc').symbol,
                    deviceState: 'state@device:0',
                    visible: true,
                }),
                mockWalletAccount({
                    symbol: getNetwork(networkConfigDeps, 'btc').symbol,
                    deviceState: 'state@device:0',
                    visible: false,
                }),
                mockWalletAccount({
                    symbol: getNetwork(networkConfigDeps, 'eth').symbol,
                    deviceState: 'state@device:0',
                    visible: true,
                }),
                mockWalletAccount({
                    symbol: getNetwork(networkConfigDeps, 'btc').symbol,
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
                enqueueNetworkActivation(
                    [getNetwork(networkConfigDeps, 'btc').symbol],
                    getNetwork(networkConfigDeps, 'btc').symbol,
                ),
            ).toEqual([getNetwork(networkConfigDeps, 'btc').symbol]);
        });

        it('appends a different network without reordering the queue', () => {
            expect(
                enqueueNetworkActivation(
                    [getNetwork(networkConfigDeps, 'btc').symbol],
                    getNetwork(networkConfigDeps, 'eth').symbol,
                ),
            ).toEqual([
                getNetwork(networkConfigDeps, 'btc').symbol,
                getNetwork(networkConfigDeps, 'eth').symbol,
            ]);
        });
    });

    describe(getNewNetworkAccounts.name, () => {
        it('returns only accounts created for the activated network after discovery started', () => {
            const existingAccount = mockWalletAccount({
                descriptor: asAccountDescriptor('existingAccount'),
                symbol: getNetwork(networkConfigDeps, 'btc').symbol,
            });
            const newBitcoinAccount = mockWalletAccount({
                descriptor: asAccountDescriptor('newBitcoinAccount'),
                symbol: getNetwork(networkConfigDeps, 'btc').symbol,
            });
            const newEthereumAccount = mockWalletAccount({
                descriptor: asAccountDescriptor('newEthereumAccount'),
                symbol: getNetwork(networkConfigDeps, 'eth').symbol,
            });

            expect(
                getNewNetworkAccounts({
                    accounts: [existingAccount, newBitcoinAccount, newEthereumAccount],
                    existingAccountKeys: new Set([existingAccount.key]),
                    networkSymbol: getNetwork(networkConfigDeps, 'btc').symbol,
                }),
            ).toEqual([newBitcoinAccount]);
        });
    });
});
