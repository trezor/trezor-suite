import { getStakingPositionAmount } from '@suite-common/earn-staking-common';
import {
    type EarnFiatPosition,
    type EarnFiatValuation,
    type FiatRatesRootState,
    type WalletSettingsRootState,
    createStableFiatRateKeys,
    createStableTickerId,
    getEarnPositionFiatAmount,
    selectBaseCurrency,
    selectCurrentFiatRatesByFiatRateKeys,
    sumEarnFiatValuations,
} from '@suite-common/wallet-core';
import type { CryptoBaseCurrencyPair, TickerId } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import {
    createWeakMapSelector,
    returnStableArrayIfEmpty,
    weakMapMemoize,
} from '@trezor/redux-utils';

import {
    type StakingDeviceRootState,
    selectDeviceStakingPositionEntries,
} from './stakingDeviceSelectors';
import { formatStakingAmount } from '../utils/formatStakingAmount';

export type StakingFiatRootState = StakingDeviceRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

const createStableFiatPosition = weakMapMemoize(
    (
        tickerId: TickerId,
        fiatRateKey: CryptoBaseCurrencyPair,
        balance: string,
    ): EarnFiatPosition => ({ tickerId, fiatRateKey, balance }),
);

const createStableFiatPositions = weakMapMemoize((...positions: EarnFiatPosition[]) => positions);

export const selectDeviceStakingFiatPositions = createWeakMapSelector(
    [selectDeviceStakingPositionEntries, selectBaseCurrency],
    (entries, baseCurrency): readonly EarnFiatPosition[] =>
        returnStableArrayIfEmpty(
            createStableFiatPositions(
                ...entries.map(({ position, descriptor: { networkSymbol } }) =>
                    createStableFiatPosition(
                        createStableTickerId(networkSymbol),
                        getFiatRateKey(networkSymbol, baseCurrency),
                        formatStakingAmount({
                            amount: getStakingPositionAmount(position),
                            networkSymbol,
                        }),
                    ),
                ),
            ),
        ),
);

const selectDeviceStakingFiatRateKeys = createWeakMapSelector(
    [selectDeviceStakingFiatPositions],
    positions =>
        createStableFiatRateKeys(...new Set(positions.map(({ fiatRateKey }) => fiatRateKey))),
);

const selectDeviceStakingCurrentFiatRates = (state: StakingFiatRootState) =>
    selectCurrentFiatRatesByFiatRateKeys(state, selectDeviceStakingFiatRateKeys(state));

export const selectDeviceStakingFiatValuations = createWeakMapSelector(
    [selectDeviceStakingFiatPositions, selectDeviceStakingCurrentFiatRates],
    (positions, currentFiatRates): readonly EarnFiatValuation[] =>
        returnStableArrayIfEmpty(
            positions.map(position => ({
                tickerId: position.tickerId,
                fiatAmount: getEarnPositionFiatAmount(position, currentFiatRates),
            })),
        ),
);

export const selectDeviceStakingTotalFiatAmount = createWeakMapSelector(
    [selectDeviceStakingFiatValuations],
    (valuations): string => sumEarnFiatValuations(valuations),
);
