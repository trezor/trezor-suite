import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
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

const btcSymbol = asNetworkSymbol('btc');
const ethSymbol = asNetworkSymbol('eth');

describe('useReceiveAccountsListData', () => {
    const defaultOverrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        device: {
            devices: [],
            selectedDevice: {
                state: { staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID },
            },
        },
        wallet: { accounts },
    };

    const renderUseReceiveAccountsListData = async (
        symbol: NetworkSymbol,
        overrides: PreloadedStatePartial<TradingTestPreloadedState> = defaultOverrides,
    ) =>
        await renderHookWithTradingProvider(
            ({ networkSymbol }) => useReceiveAccountsListData({ symbol: networkSymbol }),
            { overrides, initialProps: { networkSymbol: symbol } },
        );

    it('returns all visible accounts for the selected network', async () => {
        const { result } = await renderUseReceiveAccountsListData(btcSymbol);

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

    it('reacts to a network change', async () => {
        const { result, rerender } = await renderUseReceiveAccountsListData(btcSymbol);

        await rerender({ networkSymbol: ethSymbol });

        expect(result.current[0]?.data).toEqual([
            { account: expect.objectContaining({ key: eth1NormalAccount.key }) },
            { account: expect.objectContaining({ key: eth2legacyAccount.key }) },
        ]);
    });

    it('returns an empty array when no matching account exists', async () => {
        const { result } = await renderUseReceiveAccountsListData(btcSymbol, {
            ...defaultOverrides,
            wallet: { accounts: [] },
        });

        expect(result.current).toEqual([]);
    });
});
