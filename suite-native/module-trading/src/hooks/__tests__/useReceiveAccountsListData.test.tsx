import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import {
    PreloadedState,
    StoreProviderForTests,
    renderHook,
    waitFor,
} from '@suite-native/test-utils';

import { useReceiveAccountsListData } from '../useReceiveAccountsListData';

describe('useReceiveAccountsListData', () => {
    const defaultPreloadedState = {
        device: {
            selectedDevice: {
                state: {
                    staticSessionId: 'staticSessionId',
                },
            },
        },
        wallet: {
            accounts: [
                {
                    symbol: 'btc',
                    accountLabel: 'BTC Account #1',
                    deviceState: 'staticSessionId',
                    key: 'btc1',
                    addresses: {
                        used: [{ address: 'USED1' }, { address: 'USED2' }],
                        change: [{ address: 'CHANGE1' }],
                        unused: [{ address: 'UNUSED1' }, { address: 'UNUSED2' }],
                    },
                    visible: true,
                },
                {
                    symbol: 'btc',
                    accountLabel: 'BTC Account #2',
                    deviceState: 'staticSessionId',
                    key: 'btc2',
                    addresses: {
                        used: [],
                        change: [],
                        unused: [],
                    },
                    visible: true,
                },
                {
                    symbol: 'eth',
                    accountLabel: 'ETH Account #1',
                    deviceState: 'staticSessionId',
                    addresses: undefined,
                    key: 'eth1',
                    visible: true,
                },
            ] as unknown as Account[],
        },
    };

    const renderUseReceiveAccountsListDataHook = async (
        initialSymbol: NetworkSymbol,
        initialSelectedAccount: undefined | Account,
        preloadedState: PreloadedState = defaultPreloadedState,
    ) => {
        const ret = renderHook(
            ({ symbol, selectedAccount }) => useReceiveAccountsListData(symbol, selectedAccount),
            {
                wrapper: ({ children }) => (
                    <StoreProviderForTests preloadedState={preloadedState}>
                        {children}
                    </StoreProviderForTests>
                ),
                initialProps: {
                    symbol: initialSymbol,
                    selectedAccount: initialSelectedAccount,
                },
            },
        );

        await waitFor(() => {
            expect(ret.result.current).not.toBeUndefined();
        });

        return ret;
    };

    describe('without account selected', () => {
        it('should display all accounts for given symbol', async () => {
            const { result } = await renderUseReceiveAccountsListDataHook('btc', undefined);

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
            );

            rerender({ symbol: 'eth', selectedAccount: undefined });

            expect(result.current).toEqual([
                {
                    key: '',
                    label: '',
                    data: [{ account: expect.objectContaining({ key: 'eth1' }) }],
                },
            ]);
        });
    });

    describe('with account selected', () => {
        it('should be empty array for non BTC like assets', async () => {
            const { result } = await renderUseReceiveAccountsListDataHook(
                'eth',
                defaultPreloadedState.wallet.accounts[2],
            );

            expect(result.current).toEqual([]);
        });

        it('should return 1 unused address and all used addresses for BTC like assets', async () => {
            const { result } = await renderUseReceiveAccountsListDataHook(
                'btc',
                defaultPreloadedState.wallet.accounts[0],
            );

            expect(result.current).toEqual([
                {
                    key: 'unused',
                    label: 'New address',
                    data: [
                        {
                            account: expect.objectContaining({ key: 'btc1' }),
                            address: { address: 'UNUSED1' },
                        },
                    ],
                },
                {
                    key: 'used',
                    label: 'Used addresses',
                    data: [
                        {
                            account: expect.objectContaining({ key: 'btc1' }),
                            address: { address: 'USED1' },
                        },
                        {
                            account: expect.objectContaining({ key: 'btc1' }),
                            address: { address: 'USED2' },
                        },
                    ],
                },
            ]);
        });

        it('should not return empty sections', async () => {
            const { result } = await renderUseReceiveAccountsListDataHook(
                'btc',
                defaultPreloadedState.wallet.accounts[1],
            );

            expect(result.current).toEqual([]);
        });

        it('should not display not visible accounts', async () => {
            const preloadedState = {
                device: {
                    selectedDevice: {
                        state: {
                            staticSessionId: 'staticSessionId',
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
                preloadedState,
            );

            expect(result.current).toEqual([]);
        });
    });
});
