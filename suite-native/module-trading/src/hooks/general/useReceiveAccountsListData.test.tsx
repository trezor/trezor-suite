import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    MOCK_ACCOUNT_DEVICE_SESSION_ID,
    accounts,
    btc1NormalAccount,
    btc2legacyAccount,
    eth1NormalAccount,
    eth2legacyAccount,
} from '@suite-native/trading-fixtures';

import { useReceiveAccountsListData } from './useReceiveAccountsListData';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

describe(useReceiveAccountsListData.name, () => {
    const defaultOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        device: {
            devices: [],
            selectedDevice: {
                state: { staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID },
            },
        },
        wallet: { accounts },
    };

    const renderUseReceiveAccountsListData = (
        symbol: NetworkSymbol,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = defaultOverrides,
    ) =>
        renderHookWithTradingProvider(
            ({ networkSymbol }) => useReceiveAccountsListData({ symbol: networkSymbol }),
            { overrides, initialProps: { networkSymbol: symbol } },
        );

    it('returns all visible accounts for the selected network', () => {
        const { result } = renderUseReceiveAccountsListData('btc');

        expect(result.current).toEqual([
            {
                key: '',
                label: '',
                data: [
                    { account: expect.objectContaining({ key: btc1NormalAccount.key }) },
                    { account: expect.objectContaining({ key: btc2legacyAccount.key }) },
                ],
                sectionData: undefined,
            },
        ]);
    });

    it('reacts to a network change', () => {
        const { result, rerender } = renderUseReceiveAccountsListData('btc');

        rerender({ networkSymbol: 'eth' });

        expect(result.current[0]?.data).toEqual([
            { account: expect.objectContaining({ key: eth1NormalAccount.key }) },
            { account: expect.objectContaining({ key: eth2legacyAccount.key }) },
        ]);
    });

    it('returns an empty array when no matching account exists', () => {
        const { result } = renderUseReceiveAccountsListData('btc', {
            ...defaultOverrides,
            wallet: { accounts: [] },
        });

        expect(result.current).toEqual([]);
    });
});
