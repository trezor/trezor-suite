import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
// eslint-disable-next-line local-rules/no-package-deep-imports
import { PreloadedState, renderHookWithStoreProviderAsync } from '@suite-native/test-utils/store';
import {
    MOCK_ACCOUNT_DEVICE_SESSION_ID,
    accounts,
    btc1NormalAccount,
    btc2legacyAccount,
    eth1NormalAccount,
    eth2legacyAccount,
} from '@suite-native/trading-fixtures';

const ADDRESS_COMMON = { received: '0', sent: '0', transfers: 0 };

import { ReceiveAccountsListMode, useReceiveAccountsListData } from '../useReceiveAccountsListData';

describe('useReceiveAccountsListData', () => {
    const defaultPreloadedState = {
        device: {
            selectedDevice: {
                state: {
                    staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID,
                },
            },
        },
        wallet: { accounts },
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
                        { account: expect.objectContaining({ key: btc1NormalAccount.key }) },
                        { account: expect.objectContaining({ key: btc2legacyAccount.key }) },
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
                        { account: expect.objectContaining({ key: eth1NormalAccount.key }) },
                        { account: expect.objectContaining({ key: eth2legacyAccount.key }) },
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
                eth1NormalAccount,
                'address',
            );

            expect(result.current).toEqual([]);
        });

        it('should return 1 unused address and all used addresses for BTC like assets', async () => {
            const { result } = await renderUseReceiveAccountsListDataHook(
                'btc',
                btc1NormalAccount,
                'address',
            );

            expect(result.current).toEqual([
                {
                    key: 'unused',
                    label: 'New address',
                    sectionData: undefined,
                    data: [
                        {
                            account: expect.objectContaining({ key: btc1NormalAccount.key }),
                            address: {
                                address: 'UNUSED1',
                                path: 'path_UNUSED1',
                                balance: '0',
                                ...ADDRESS_COMMON,
                            },
                        },
                    ],
                },
                {
                    key: 'used',
                    label: 'Used addresses',
                    sectionData: undefined,
                    data: [
                        {
                            account: expect.objectContaining({ key: btc1NormalAccount.key }),
                            address: {
                                address: 'USED1',
                                balance: '10000000',
                                path: 'path_USED1',
                                ...ADDRESS_COMMON,
                            },
                        },
                        {
                            account: expect.objectContaining({ key: btc1NormalAccount.key }),
                            address: {
                                address: 'USED2',
                                balance: '20000000',
                                path: 'path_USED2',
                                ...ADDRESS_COMMON,
                            },
                        },
                    ],
                },
            ]);
        });

        it('should not return empty sections', async () => {
            const { result } = await renderUseReceiveAccountsListDataHook(
                'btc',
                btc2legacyAccount,
                'address',
            );

            expect(result.current).toEqual([]);
        });

        it('should not display not visible accounts', async () => {
            const preloadedState = {
                device: {
                    selectedDevice: {
                        state: {
                            staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID,
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
                            key: eth1NormalAccount.key,
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
