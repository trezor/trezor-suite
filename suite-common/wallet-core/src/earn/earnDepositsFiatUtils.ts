import { A, F } from '@mobily/ts-belt';

import {
    type NetworkSymbol,
    type StakingNetworkSymbol,
    asNetworkSymbol,
} from '@suite-common/wallet-config';
import {
    type BaseCurrencyAmount,
    type CryptoBaseCurrencyPair,
    type RatesByKey,
    type TickerId,
    type TokenAddress,
    asBaseCurrencyAmount,
    toTokenAddress,
} from '@suite-common/wallet-types';
import {
    getContractAddressForNetworkSymbol,
    getFiatRateKey,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

export type EarnStakingDepositFiatInput = {
    id: string;
    symbol: StakingNetworkSymbol;
    balance: string | null;
};

export type EarnStablecoinYieldDepositFiatInput = {
    id: string;
    networkSymbol: NetworkSymbol;
    tokenContractAddress: TokenAddress;
    balance: string | null;
};

export type CalculatedEarnStakingDeposit<
    TDeposit extends EarnStakingDepositFiatInput = EarnStakingDepositFiatInput,
> = {
    deposit: TDeposit;
    balance: string;
    fiatAmount: BaseCurrencyAmount;
    hasFiatRate: boolean;
};

export type CalculatedEarnStablecoinYieldDeposit<
    TDeposit extends EarnStablecoinYieldDepositFiatInput = EarnStablecoinYieldDepositFiatInput,
> = {
    deposit: TDeposit;
    balance: string;
    fiatAmount: BaseCurrencyAmount;
    hasFiatRate: boolean;
    normalizedTokenAddress: TokenAddress;
};

type CalculateEarnDepositsFiatDataParams<
    TStakingDeposit extends EarnStakingDepositFiatInput,
    TStablecoinYieldDeposit extends EarnStablecoinYieldDepositFiatInput,
> = {
    stakingDeposits: TStakingDeposit[];
    stablecoinYieldDeposits: TStablecoinYieldDeposit[];
    currentFiatRates: RatesByKey | undefined;
    baseCurrencyCode: BaseCurrencyCode;
};

type GetEarnDepositsFiatStatusParams = {
    missingStakingRateTickers: TickerId[];
    missingStablecoinYieldRateTickers: TickerId[];
    hasStakingFiatRate: boolean;
    hasStablecoinYieldFiatRate: boolean;
    isFiatRatesLoading: boolean;
};

const getUniqueTickers = (tickers: TickerId[]): TickerId[] =>
    F.toMutable(
        A.uniqBy(tickers, ticker =>
            ticker.tokenAddress ? `${ticker.symbol}-${ticker.tokenAddress}` : ticker.symbol,
        ),
    );

export const getTokenFiatRate = (
    currentFiatRates: RatesByKey | undefined,
    fiatRateKey: CryptoBaseCurrencyPair,
): number | undefined => {
    if (!currentFiatRates) {
        return undefined;
    }

    const exactRate = currentFiatRates[fiatRateKey]?.rate;
    if (exactRate !== undefined) {
        return exactRate;
    }

    // Rates fetched for account tokens use the blockbook contract-address casing,
    // which may differ from the casing returned by the yield provider.
    const lowerCasedFiatRateKey = fiatRateKey.toLowerCase();
    const caseInsensitiveMatch = Object.entries(currentFiatRates).find(
        ([key]) => key.toLowerCase() === lowerCasedFiatRateKey,
    );

    return caseInsensitiveMatch?.[1]?.rate;
};

const calculateDepositFiat = (balance: string, rate: number | undefined) => {
    const fiatAmount = toFiatCurrency({ amount: balance, rate });

    return {
        fiatAmount: asBaseCurrencyAmount(new BigNumber(fiatAmount ?? '0')),
        hasFiatRate: fiatAmount !== null,
    };
};

export const calculateEarnDepositsFiatData = <
    TStakingDeposit extends EarnStakingDepositFiatInput,
    TStablecoinYieldDeposit extends EarnStablecoinYieldDepositFiatInput,
>({
    stakingDeposits,
    stablecoinYieldDeposits,
    currentFiatRates,
    baseCurrencyCode,
}: CalculateEarnDepositsFiatDataParams<TStakingDeposit, TStablecoinYieldDeposit>) => {
    const calculatedStakingDeposits: CalculatedEarnStakingDeposit<TStakingDeposit>[] =
        stakingDeposits.flatMap(deposit => {
            if (deposit.balance === null || deposit.balance === '0') {
                return [];
            }

            const fiatRateKey = getFiatRateKey(asNetworkSymbol(deposit.symbol), baseCurrencyCode);
            const fiatRate = currentFiatRates?.[fiatRateKey]?.rate;

            return [
                {
                    deposit,
                    balance: deposit.balance,
                    ...calculateDepositFiat(deposit.balance, fiatRate),
                },
            ];
        });

    const calculatedStablecoinYieldDeposits: CalculatedEarnStablecoinYieldDeposit<TStablecoinYieldDeposit>[] =
        stablecoinYieldDeposits.flatMap(deposit => {
            if (deposit.balance === null || deposit.balance === '0') {
                return [];
            }

            const normalizedTokenAddress = toTokenAddress(
                getContractAddressForNetworkSymbol(
                    deposit.networkSymbol,
                    deposit.tokenContractAddress,
                ),
            );
            const fiatRateKey = getFiatRateKey(
                deposit.networkSymbol,
                baseCurrencyCode,
                normalizedTokenAddress,
            );
            const fiatRate = getTokenFiatRate(currentFiatRates, fiatRateKey);

            return [
                {
                    deposit,
                    balance: deposit.balance,
                    ...calculateDepositFiat(deposit.balance, fiatRate),
                    normalizedTokenAddress,
                },
            ];
        });

    const missingStakingRateTickers = getUniqueTickers(
        calculatedStakingDeposits.flatMap(({ deposit, hasFiatRate }) =>
            hasFiatRate ? [] : [{ symbol: asNetworkSymbol(deposit.symbol) }],
        ),
    );
    const missingStablecoinYieldRateTickers = getUniqueTickers(
        calculatedStablecoinYieldDeposits.flatMap(
            ({ deposit, hasFiatRate, normalizedTokenAddress }) =>
                hasFiatRate
                    ? []
                    : [{ symbol: deposit.networkSymbol, tokenAddress: normalizedTokenAddress }],
        ),
    );
    const missingRateTickers = getUniqueTickers([
        ...missingStakingRateTickers,
        ...missingStablecoinYieldRateTickers,
    ]);
    const stakingFiatAmount = asBaseCurrencyAmount(
        calculatedStakingDeposits.reduce(
            (sum, deposit) => sum.plus(deposit.fiatAmount),
            new BigNumber(0),
        ),
    );
    const stablecoinYieldFiatAmount = asBaseCurrencyAmount(
        calculatedStablecoinYieldDeposits.reduce(
            (sum, deposit) => sum.plus(deposit.fiatAmount),
            new BigNumber(0),
        ),
    );
    const totalDepositedFiatAmount = asBaseCurrencyAmount(
        stakingFiatAmount.plus(stablecoinYieldFiatAmount),
    );

    return {
        stakingDeposits: calculatedStakingDeposits,
        stablecoinYieldDeposits: calculatedStablecoinYieldDeposits,
        missingStakingRateTickers,
        missingStablecoinYieldRateTickers,
        missingRateTickers,
        stakingFiatAmount,
        stablecoinYieldFiatAmount,
        totalDepositedFiatAmount,
        hasStakingFiatRate: calculatedStakingDeposits.some(({ hasFiatRate }) => hasFiatRate),
        hasStablecoinYieldFiatRate: calculatedStablecoinYieldDeposits.some(
            ({ hasFiatRate }) => hasFiatRate,
        ),
    };
};

export const getEarnDepositsFiatStatus = ({
    missingStakingRateTickers,
    missingStablecoinYieldRateTickers,
    hasStakingFiatRate,
    hasStablecoinYieldFiatRate,
    isFiatRatesLoading,
}: GetEarnDepositsFiatStatusParams) => {
    const isStakingFiatRateMissing = missingStakingRateTickers.length > 0;
    const isStablecoinYieldFiatRateMissing = missingStablecoinYieldRateTickers.length > 0;
    const isFiatTotalIncomplete =
        (isStakingFiatRateMissing || isStablecoinYieldFiatRateMissing) && !isFiatRatesLoading;
    const isFiatTotalUnavailable =
        isFiatTotalIncomplete && !hasStakingFiatRate && !hasStablecoinYieldFiatRate;

    return {
        isFiatTotalIncomplete,
        isFiatTotalUnavailable,
        isStakingFiatRateMissing,
        isStablecoinYieldFiatRateMissing,
    };
};
