import { getTranslation } from '@suite-native/intl';
import { MOCK_ACCOUNT_DEVICE_SESSION_ID, btc1NormalAccount } from '@suite-native/trading-fixtures';

import { useReceiveAddressesListData } from './useReceiveAddressesListData';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderHookWithTradingProvider,
} from '../../test-utils/tradingTestUtils';

jest.mock('@suite-native/labeling', () => ({
    ...jest.requireActual('@suite-native/labeling'),
    selectIsLabellingAllowed: () => true,
}));

const mockAddressLabels = [
    {
        address: 'USED2',
        label: 'Savings address',
    },
];

jest.mock('@suite-common/suite-sync', () => ({
    ...jest.requireActual('@suite-common/suite-sync'),
    selectSuiteSyncAddressLabels: () => mockAddressLabels,
}));

describe(useReceiveAddressesListData.name, () => {
    const overrides: PreloadedStatePartial<TradingTestPreloadedState> = {
        device: {
            devices: [],
            selectedDevice: {
                state: { staticSessionId: MOCK_ACCOUNT_DEVICE_SESSION_ID },
            },
        },
        wallet: { accounts: [btc1NormalAccount] },
    };

    const renderUseReceiveAddressesListData = (searchQuery = '') =>
        renderHookWithTradingProvider(
            ({ query }) =>
                useReceiveAddressesListData({
                    accountKey: btc1NormalAccount.key,
                    searchQuery: query,
                }),
            { overrides, initialProps: { query: searchQuery } },
        );

    it('returns the first fresh address and all used addresses in separate sections', () => {
        const { result } = renderUseReceiveAddressesListData();

        expect(result.current).toEqual([
            expect.objectContaining({
                key: 'unused',
                label: getTranslation('moduleTrading.accountScreen.newAddress'),
                data: [
                    expect.objectContaining({
                        address: expect.objectContaining({ address: 'UNUSED1' }),
                    }),
                ],
            }),
            expect.objectContaining({
                key: 'used',
                label: getTranslation('moduleTrading.accountScreen.usedAddresses'),
                data: [
                    expect.objectContaining({
                        address: expect.objectContaining({ address: 'USED1' }),
                    }),
                    expect.objectContaining({
                        address: expect.objectContaining({ address: 'USED2' }),
                    }),
                ],
            }),
        ]);
    });

    it('filters case-insensitively by full addresses without changing address order', () => {
        const { result } = renderUseReceiveAddressesListData('used1');

        expect(
            result.current.flatMap(section =>
                section.data.map(receiveAccount => receiveAccount.address?.address),
            ),
        ).toEqual(['UNUSED1', 'USED1']);
    });

    it('filters by a Suite Sync label', () => {
        const { result } = renderUseReceiveAddressesListData('savings');

        expect(result.current).toEqual([
            expect.objectContaining({
                key: 'used',
                data: [
                    expect.objectContaining({
                        address: expect.objectContaining({ address: 'USED2' }),
                    }),
                ],
            }),
        ]);
    });

    it('returns no sections when the query does not match', () => {
        const { result } = renderUseReceiveAddressesListData('missing');

        expect(result.current).toEqual([]);
    });
});
