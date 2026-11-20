import { type StakingProductAccess } from '@suite-common/earn-staking-common';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { resolveStakingPromoAccounts } from './resolveStakingPromoAccounts';

const createAccount = (symbol: string, descriptor: string): Account =>
    mockWalletAccount({
        symbol: asNetworkSymbol(symbol),
        descriptor: asAccountDescriptor(descriptor),
    });

const stakedEthAccount = createAccount('eth', 'eth1');
const unstakedEthAccount = createAccount('eth', 'eth2');
const stakedTronAccount = createAccount('trx', 'trx1');
const unstakedTronAccount = createAccount('trx', 'trx2');
const delegatedCardanoAccount = createAccount('ada', 'ada1');
const undelegatedCardanoAccount = createAccount('ada', 'ada2');

const stakedAccountKeys = new Set([
    stakedEthAccount.key,
    stakedTronAccount.key,
    delegatedCardanoAccount.key,
]);

type ResolveParams = {
    symbol: string;
    access: StakingProductAccess | null;
    accounts: Account[];
    isDeviceInViewOnlyMode?: boolean;
};

const resolve = ({ symbol, access, accounts, isDeviceInViewOnlyMode = false }: ResolveParams) =>
    resolveStakingPromoAccounts({
        symbol: asNetworkSymbol(symbol),
        access,
        accounts,
        isAccountStakingActive: account => stakedAccountKeys.has(account.key),
        isDeviceInViewOnlyMode,
    });

describe('resolveStakingPromoAccounts', () => {
    describe('with a connected device', () => {
        it('returns only the staked accounts of a read-only network for viewing', () => {
            expect(
                resolve({
                    symbol: 'trx',
                    access: 'read-only',
                    accounts: [stakedTronAccount, unstakedTronAccount, stakedEthAccount],
                }),
            ).toEqual({
                type: 'navigate',
                support: 'read-only',
                navigableAccounts: [stakedTronAccount],
            });
            expect(
                resolve({
                    symbol: 'ada',
                    access: 'read-only',
                    accounts: [undelegatedCardanoAccount, delegatedCardanoAccount],
                }),
            ).toEqual({
                type: 'navigate',
                support: 'read-only',
                navigableAccounts: [delegatedCardanoAccount],
            });
        });

        it('points a read-only network to desktop when no account is staked', () => {
            expect(
                resolve({ symbol: 'trx', access: 'read-only', accounts: [unstakedTronAccount] }),
            ).toEqual({ type: 'desktop-only' });
            expect(
                resolve({
                    symbol: 'ada',
                    access: 'read-only',
                    accounts: [undelegatedCardanoAccount],
                }),
            ).toEqual({ type: 'desktop-only' });
        });

        it('asks to enable a network without accounts, whatever its access', () => {
            expect(
                resolve({ symbol: 'eth', access: 'manage', accounts: [undelegatedCardanoAccount] }),
            ).toEqual({ type: 'enable-network' });
            expect(resolve({ symbol: 'ada', access: 'read-only', accounts: [] })).toEqual({
                type: 'enable-network',
            });
            expect(resolve({ symbol: 'trx', access: 'listed', accounts: [] })).toEqual({
                type: 'enable-network',
            });
        });

        it('returns every account of a manageable network', () => {
            expect(
                resolve({
                    symbol: 'eth',
                    access: 'manage',
                    accounts: [stakedEthAccount, unstakedEthAccount, undelegatedCardanoAccount],
                }),
            ).toEqual({
                type: 'navigate',
                support: 'manage',
                navigableAccounts: [stakedEthAccount, unstakedEthAccount],
            });
        });

        it('points to desktop without a product and for a listed or hidden one', () => {
            expect(resolve({ symbol: 'eth', access: null, accounts: [stakedEthAccount] })).toEqual({
                type: 'desktop-only',
            });
            expect(
                resolve({ symbol: 'eth', access: 'listed', accounts: [stakedEthAccount] }),
            ).toEqual({ type: 'desktop-only' });
            expect(
                resolve({ symbol: 'eth', access: 'hidden', accounts: [stakedEthAccount] }),
            ).toEqual({ type: 'desktop-only' });
        });
    });

    describe('with a device in view-only mode', () => {
        it('returns only the staked accounts of a manageable network for viewing', () => {
            expect(
                resolve({
                    symbol: 'eth',
                    access: 'manage',
                    accounts: [stakedEthAccount, unstakedEthAccount],
                    isDeviceInViewOnlyMode: true,
                }),
            ).toEqual({
                type: 'navigate',
                support: 'read-only',
                navigableAccounts: [stakedEthAccount],
            });
        });

        it('asks to connect the device when no account of a manageable network is staked', () => {
            expect(
                resolve({
                    symbol: 'eth',
                    access: 'manage',
                    accounts: [unstakedEthAccount],
                    isDeviceInViewOnlyMode: true,
                }),
            ).toEqual({ type: 'connect-device' });
        });

        it('still asks to enable a manageable network without accounts', () => {
            expect(
                resolve({
                    symbol: 'eth',
                    access: 'manage',
                    accounts: [],
                    isDeviceInViewOnlyMode: true,
                }),
            ).toEqual({ type: 'enable-network' });
        });

        it('keeps a read-only network desktop only when no account is staked', () => {
            expect(
                resolve({
                    symbol: 'trx',
                    access: 'read-only',
                    accounts: [unstakedTronAccount],
                    isDeviceInViewOnlyMode: true,
                }),
            ).toEqual({ type: 'desktop-only' });
        });
    });
});
