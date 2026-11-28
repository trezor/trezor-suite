import {
    getStakingPositionAmount,
    hasUnvaluedLiquidStakingBalance,
} from '@suite-common/earn-staking-common';
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
    selectDeviceEarnStakingPositionEntries,
} from './stakingDeviceSelectors';
import { formatStakingAmount } from '../utils/formatStakingAmount';

export type StakingFiatRootState = StakingDeviceRootState &
    FiatRatesRootState &
    WalletSettingsRootState;

type StakingFiatPosition = Omit<EarnFiatPosition, 'balance'> & { balance: string | null };

const createStableFiatPosition = weakMapMemoize(
    (
        tickerId: TickerId,
        fiatRateKey: CryptoBaseCurrencyPair,
        balance: string | null,
    ): StakingFiatPosition => ({ tickerId, fiatRateKey, balance }),
);

const createStableFiatPositions = weakMapMemoize(
    (...positions: StakingFiatPosition[]) => positions,
);

export const selectDeviceStakingFiatPositions = createWeakMapSelector(
    [selectDeviceEarnStakingPositionEntries, selectBaseCurrency],
    (entries, baseCurrency): readonly StakingFiatPosition[] =>
        returnStableArrayIfEmpty(
            createStableFiatPositions(
                ...entries.map(({ position, descriptor: { networkSymbol } }) =>
                    createStableFiatPosition(
                        createStableTickerId(networkSymbol),
                        getFiatRateKey(networkSymbol, baseCurrency),
                        hasUnvaluedLiquidStakingBalance(position)
                            ? null
                            : formatStakingAmount({
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
            positions.map(({ tickerId, fiatRateKey, balance }) => ({
                tickerId,
                fiatAmount:
                    balance === null
                        ? null
                        : getEarnPositionFiatAmount(
                              { tickerId, fiatRateKey, balance },
                              currentFiatRates,
                          ),
            })),
        ),
);

export const selectDeviceStakingTotalFiatAmount = createWeakMapSelector(
    [selectDeviceStakingFiatValuations],
    (valuations): string => sumEarnFiatValuations(valuations),
);
