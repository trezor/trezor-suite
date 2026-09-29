import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account, asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount, networkSpecificDefaultCardano } from '@suite-common/wallet-types/mocks';
import { getAccountTotalStakingBalance } from '@suite-common/wallet-utils';

import { resolveStakingPromoAccounts } from './resolveStakingPromoAccounts';

jest.mock('@suite-common/wallet-utils', () => ({
    ...jest.requireActual('@suite-common/wallet-utils'),
    getAccountTotalStakingBalance: jest.fn(),
}));

const mockGetAccountTotalStakingBalance = jest.mocked(getAccountTotalStakingBalance);

const networkSpecificUndelegatedCardano = {
    ...networkSpecificDefaultCardano,
    misc: { staking: { ...networkSpecificDefaultCardano.misc.staking, isActive: false } },
};

const createEthereumAccount = (descriptor: string): Account =>
    mockWalletAccount({
        symbol: asNetworkSymbol('eth'),
        descriptor: asAccountDescriptor(descriptor),
    });

const createTronAccount = (): Account => mockWalletAccount({ symbol: asNetworkSymbol('trx') });

const createDelegatedCardanoAccount = (descriptor: string, balance = '0'): Account =>
    mockWalletAccount(
        { symbol: asNetworkSymbol('ada'), descriptor: asAccountDescriptor(descriptor), balance },
        networkSpecificDefaultCardano,
    );

const createUndelegatedCardanoAccount = (descriptor: string): Account =>
    mockWalletAccount(
        { symbol: asNetworkSymbol('ada'), descriptor: asAccountDescriptor(descriptor) },
        networkSpecificUndelegatedCardano,
    );

describe('resolveStakingPromoAccounts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetAccountTotalStakingBalance.mockReturnValue(null);
    });

    describe('with a connected device', () => {
        it('marks a network without a mobile staking flow as desktop only', () => {
            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('trx'),
                    accounts: [createTronAccount()],
                    isDeviceInViewOnlyMode: false,
                }),
            ).toEqual({ type: 'desktop-only' });
        });

        it('asks to enable a manageable network without accounts', () => {
            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('eth'),
                    accounts: [createUndelegatedCardanoAccount('ada1')],
                    isDeviceInViewOnlyMode: false,
                }),
            ).toEqual({ type: 'enable-network' });
        });

        it('returns every account of a manageable network', () => {
            const ethAccount = createEthereumAccount('eth1');
            const accounts = [ethAccount, createUndelegatedCardanoAccount('ada1')];

            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('eth'),
                    accounts,
                    isDeviceInViewOnlyMode: false,
                }),
            ).toEqual({ type: 'navigate', support: 'manage', navigableAccounts: [ethAccount] });
        });

        it('returns only the delegated Cardano accounts', () => {
            const delegatedAccount = createDelegatedCardanoAccount('ada2', '10000000');
            const accounts = [createUndelegatedCardanoAccount('ada1'), delegatedAccount];

            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('ada'),
                    accounts,
                    isDeviceInViewOnlyMode: false,
                }),
            ).toEqual({
                type: 'navigate',
                support: 'view',
                navigableAccounts: [delegatedAccount],
            });
        });

        it('returns a Cardano account that is delegated but emptied', () => {
            const emptiedAccount = createDelegatedCardanoAccount('ada1', '0');

            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('ada'),
                    accounts: [emptiedAccount],
                    isDeviceInViewOnlyMode: false,
                }),
            ).toEqual({
                type: 'navigate',
                support: 'view',
                navigableAccounts: [emptiedAccount],
            });
        });

        it('marks Cardano as desktop only when no account is delegated', () => {
            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('ada'),
                    accounts: [createUndelegatedCardanoAccount('ada1')],
                    isDeviceInViewOnlyMode: false,
                }),
            ).toEqual({ type: 'desktop-only' });
        });

        it('asks to enable Cardano without accounts before pointing to desktop', () => {
            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('ada'),
                    accounts: [],
                    isDeviceInViewOnlyMode: false,
                }),
            ).toEqual({ type: 'enable-network' });
        });

        it('asks to enable a network without a mobile staking flow when it has no accounts', () => {
            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('trx'),
                    accounts: [createEthereumAccount('eth1')],
                    isDeviceInViewOnlyMode: false,
                }),
            ).toEqual({ type: 'enable-network' });
        });
    });

    describe('with a device in view-only mode', () => {
        it('returns only the staked accounts of a manageable network for viewing', () => {
            const stakedAccount = createEthereumAccount('staked');
            const unstakedAccount = createEthereumAccount('unstaked');
            mockGetAccountTotalStakingBalance.mockImplementation(account =>
                account.key === stakedAccount.key ? '1000000000000000' : '0',
            );

            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('eth'),
                    accounts: [stakedAccount, unstakedAccount],
                    isDeviceInViewOnlyMode: true,
                }),
            ).toEqual({
                type: 'navigate',
                support: 'view',
                navigableAccounts: [stakedAccount],
            });
        });

        it('asks to connect the device when no account of a manageable network is staked', () => {
            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('eth'),
                    accounts: [createEthereumAccount('unstaked')],
                    isDeviceInViewOnlyMode: true,
                }),
            ).toEqual({ type: 'connect-device' });
        });

        it('still asks to enable a manageable network without accounts', () => {
            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('eth'),
                    accounts: [],
                    isDeviceInViewOnlyMode: true,
                }),
            ).toEqual({ type: 'enable-network' });
        });

        it('keeps Cardano desktop only when no account is delegated', () => {
            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('ada'),
                    accounts: [createUndelegatedCardanoAccount('ada1')],
                    isDeviceInViewOnlyMode: true,
                }),
            ).toEqual({ type: 'desktop-only' });
        });

        it('keeps a network without a mobile staking flow desktop only', () => {
            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('trx'),
                    accounts: [createTronAccount()],
                    isDeviceInViewOnlyMode: true,
                }),
            ).toEqual({ type: 'desktop-only' });
        });

        it('still asks to enable a network without a mobile staking flow when it has no accounts', () => {
            expect(
                resolveStakingPromoAccounts({
                    symbol: asNetworkSymbol('trx'),
                    accounts: [],
                    isDeviceInViewOnlyMode: true,
                }),
            ).toEqual({ type: 'enable-network' });
        });
    });
});
