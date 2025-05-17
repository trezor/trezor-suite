import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { PreloadedState, renderHookWithStoreProviderAsync } from '@suite-native/test-utils';
import { StaticSessionId } from '@trezor/connect';

import accounts from '../../../__fixtures__/accounts.json';
import { ReceiveAccountsListMode, useReceiveAccountsListData } from '../useReceiveAccountsListData';

describe('useReceiveAccountsListData', () => {
    const defaultPreloadedState = {
        device: {
            selectedDevice: {
                state: {
                    staticSessionId: 'staticSessionId' as StaticSessionId,
                },
            },
        },
        wallet: { accounts: accounts as Account[] },
    };

    const renderUseReceiveAccountsListDataHook = (
        initialSymbol: NetworkSymbol,
        initialSelectedAccount: undefined | Account,
        initialMode: ReceiveAccountsListMode,
        preloadedState: PreloadedState = defaultPreloadedState,
    ) =>
        renderHookWithStoreProviderAsync(
            ({ symbol, selectedAccount, mode }) =>
                useReceiveAccountsListData({ symbol, selectedAccount, mode }),
            {
                preloadedState,
                initialProps: {
                    symbol: initialSymbol,
                    selectedAccount: initialSelectedAccount,
                    mode: initialMode,
                },
            },
        );

    describe('without account selected', () => {
        it('should display all accounts for given symbol', async () => {
            const { result } = await renderUseReceiveAccountsListDataHook(
                'btc',
                undefined,
                'account',
            );

            expect(result.current).toEqual([
                {
                    key: '',
                    label: '',
                    data: [
                        { account: expect.objectContaining({ key: 'btc1' }) },
                        { account: expect.objectContaining({ key: 'btc2' }) },
                    ],
                },
            ]);
        });

        it('should react to symbol change', async () => {
            const { result, rerender } = await renderUseReceiveAccountsListDataHook(
                'btc',
                undefined,
                'account',
            );

            rerender({ symbol: 'eth', selectedAccount: undefined, mode: 'account' });

            expect(result.current).toEqual([
                {
                    key: '',
                    label: '',
                    data: [
                        { account: expect.objectContaining({ key: 'eth1' }) },
                        { account: expect.objectContaining({ key: 'eth2' }) },
                    ],
                },
            ]);
        });

        it('should render empty array when wallet accounts are not initialized', async () => {
            const { result } = await renderUseReceiveAccountsListDataHook(
                'btc',
                undefined,
                'account',
                {
                    ...defaultPreloadedState,
                    wallet: undefined,
                },
            );

            expect(result.current).toEqual([]);
        });
    });

    describe('with account selected', () => {
        it('should be empty array for non BTC like assets', async () => {
            const { result } = await renderUseReceiveAccountsListDataHook(
                'eth',
                defaultPreloadedState.wallet.accounts[2],
                'address',
            );

            expect(result.current).toEqual([]);
        });

        it('should return 1 unused address and all used addresses for BTC like assets', async () => {
            const { result } = await renderUseReceiveAccountsListDataHook(
                'btc',
                defaultPreloadedState.wallet.accounts[0],
                'address',
            );

            expect(result.current).toEqual([
                {
                    key: 'unused',
                    label: 'New address',
                    data: [
                        {
                            account: expect.objectContaining({ key: 'btc1' }),
                            address: { address: 'UNUSED1', path: 'path_UNUSED1' },
                        },
                    ],
                },
                {
                    key: 'used',
                    label: 'Used addresses',
                    data: [
                        {
                            account: expect.objectContaining({ key: 'btc1' }),
                            address: { address: 'USED1', balance: '10000000', path: 'path_USED1' },
                        },
                        {
                            account: expect.objectContaining({ key: 'btc1' }),
                            address: { address: 'USED2', balance: '20000000', path: 'path_USED2' },
                        },
                    ],
                },
            ]);
        });

        it('should not return empty sections', async () => {
            const { result } = await renderUseReceiveAccountsListDataHook(
                'btc',
                defaultPreloadedState.wallet.accounts[1],
                'address',
            );

            expect(result.current).toEqual([]);
        });

        it('should not display not visible accounts', async () => {
            const preloadedState = {
                device: {
                    selectedDevice: {
                        state: {
                            staticSessionId: 'staticSessionId' as StaticSessionId,
                        },
                    },
                },
                wallet: {
                    accounts: [
                        {
                            symbol: 'eth',
                            accountLabel: 'ETH Account #1',
                            deviceState: 'staticSessionId',
                            addresses: undefined,
                            key: 'eth1',
                            visible: false,
                        },
                    ] as unknown as Account[],
                },
            };
            const { result } = await renderUseReceiveAccountsListDataHook(
                'eth',
                undefined,
                'account',
                preloadedState,
            );

            expect(result.current).toEqual([]);
        });
    });
});
