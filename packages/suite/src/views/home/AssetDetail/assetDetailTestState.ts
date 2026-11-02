import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getWalletAssetKey } from '@suite-common/wallet-core';
import { type Account, type CurrentRate, type Timestamp } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/device-utils';

import { type AppState } from 'src/reducers/store';

import { mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

export const ETH = asNetworkSymbol('eth');

export const ETH_ASSET_KEY = getWalletAssetKey({ deviceState: DEVICE_STATE, symbol: ETH });

// In dollars, the dollar rate is the rate itself.
const mockRate = (rate: number) =>
    ({
        rate,
        usdRate: rate,
        lastTickerTimestamp: 1700000000000 as Timestamp,
        lastSuccessfulFetchTimestamp: 1700000000000 as Timestamp,
        isLoading: false,
        error: null,
    }) as CurrentRate;

const mockEthRates = (rate: number | undefined) =>
    rate === undefined ? {} : { [getFiatRateKey(ETH, 'usd')]: mockRate(rate) };

type EthAssetStateParams = {
    accounts: Account[];
    /** What one ether costs, if the market prices it at all. */
    ethRate?: number;
    /** What it cost a week ago. */
    ethWeekAgoRate?: number;
};

/** A device holding ether in `accounts`, priced in dollars. */
export const getEthAssetState = ({
    accounts,
    ethRate,
    ethWeekAgoRate,
}: EthAssetStateParams): AppState => ({
    ...mockInitialAppState,
    networks: mockNetworksState([ETH]),
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts,
        settings: {
            ...mockInitialAppState.wallet.settings,
            enabledNetworks: [ETH],
            localCurrency: 'usd',
        },
        fiat: {
            ...mockInitialAppState.wallet.fiat,
            current: mockEthRates(ethRate),
            lastWeek: mockEthRates(ethWeekAgoRate),
        },
    },
});
