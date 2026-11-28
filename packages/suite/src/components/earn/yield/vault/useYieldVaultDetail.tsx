import { type ReactNode, createContext, useContext, useMemo } from 'react';

import { useEarnMissingRateTickersQuery } from '@suite-common/earn';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type Variant } from '@suite-common/suite-types';
import {
    type TokenAddress,
    type TokenSymbol,
    toTokenAddress,
    toTokenSymbol,
} from '@suite-common/tokens';
import {
    type ResolvedYieldFlowData,
    getYieldDepositableBalance,
    getYieldVaultContractAddress,
    selectBaseCurrency,
    selectCurrentFiatRatesByFiatRateKeys,
    selectFiatFromCryptoValue,
    useMissingRateTickersQuery,
} from '@suite-common/wallet-core';
import {
    type Account,
    type BaseCurrencyAmount,
    type CryptoBaseCurrencyPair,
    type TickerId,
} from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol, getFiatRateKey } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { useMessageSystemYield } from '#src/hooks/suite/useMessageSystemYield';
import { useSelector } from '#src/hooks/suite/useSelector';

import {
    getBonusRewardAmount,
    getBonusRewards,
    getRewardsFiatAmount,
} from './yieldVaultDetailUtils';

export type YieldVaultFlowData = Extract<ResolvedYieldFlowData, { resolutionStatus: 'resolved' }>;

type YieldVaultToken = {
    balance: string;
    symbol: string;
    decimals: number | undefined;
};

type YieldVaultUnderlyingToken = YieldVaultToken & {
    vaultToken: YieldDtoV2['token'];
};

type YieldVaultReceiptToken = YieldVaultToken & {
    vaultToken: YieldDtoV2['outputToken'];
};

type YieldVaultBonusRewardToken = {
    symbol: TokenSymbol;
    decimals: number;
    address: TokenAddress | null;
};

type YieldVaultBonusReward = {
    token: YieldVaultBonusRewardToken;
    crypto: string | null;
};

type YieldVaultBonusRewardRate = {
    token: YieldVaultBonusRewardToken;
    rate: number;
    fiatRateKey: CryptoBaseCurrencyPair | null;
};

type YieldVaultRewards = {
    crypto: string;
    fiat: BaseCurrencyAmount | null;
    bonus: YieldVaultBonusReward[];
};

type YieldVaultMessageSystem = {
    isDisabled: boolean;
    content: string | undefined;
    variant: Variant | undefined;
};

type YieldVaultDetailContextType = {
    account: Account;
    vault: YieldDtoV2;
    hasVaultPosition: boolean;
    positionInUnderlying: string;
    hasPositionInUnderlying: boolean;
    depositableBalance: string;
    hasDepositableBalance: boolean;
    fiatAmount: BaseCurrencyAmount | null;
    apy: number | null;
    yearlyRewards: YieldVaultRewards;
    potentialRewards: YieldVaultRewards;
    underlyingToken: YieldVaultUnderlyingToken;
    receiptToken: YieldVaultReceiptToken;
    messageSystem: {
        deposit: YieldVaultMessageSystem;
        withdraw: YieldVaultMessageSystem;
    };
};

const YieldVaultDetailContext = createContext<YieldVaultDetailContextType | undefined>(undefined);

interface YieldVaultDetailProviderProps {
    children: ReactNode;
    yieldFlowData: YieldVaultFlowData;
}

export const YieldVaultDetailProvider = ({
    children,
    yieldFlowData,
}: YieldVaultDetailProviderProps) => {
    const {
        account,
        vault,
        token: resolvedUnderlyingToken,
        receiptToken: resolvedReceiptToken,
        depositedAmount: positionInUnderlying,
        depositedSharesAmount,
        apy,
        isWrappedNativeVault,
        wrappedNativeSymbol,
    } = yieldFlowData;

    const baseCurrencyCode = useSelector(selectBaseCurrency);

    // Only for its fetch of the earn fiat rates that are still missing.
    useEarnMissingRateTickersQuery();

    const vaultContractAddress = getYieldVaultContractAddress(vault);

    const receiptTokenBalance = depositedSharesAmount;
    const receiptTokenSymbol = toTokenSymbol(resolvedReceiptToken.symbol);
    const receiptTokenDecimals = resolvedReceiptToken.decimals;

    const underlyingTokenSymbol = toTokenSymbol(
        isWrappedNativeVault && wrappedNativeSymbol
            ? wrappedNativeSymbol
            : resolvedUnderlyingToken.symbol,
    );
    const underlyingTokenDecimals = resolvedUnderlyingToken.decimals;

    const depositableBalance = getYieldDepositableBalance({
        networkSymbol: account.symbol,
        nativeFormattedBalance: account.formattedBalance,
        vaultTokenAddress: vault.token.address,
        matchedTokenBalance: resolvedUnderlyingToken.balance,
    });

    const hasVaultPosition = new BigNumber(receiptTokenBalance).gt(0);

    const receiptTokenAddress =
        hasVaultPosition && resolvedReceiptToken.contractAddress
            ? toTokenAddress(resolvedReceiptToken.contractAddress)
            : undefined;
    const fiatAmount = useSelector(state =>
        selectFiatFromCryptoValue(state, receiptTokenBalance, account.symbol, receiptTokenAddress),
    );

    const underlyingTokenAddress =
        !isWrappedNativeVault && resolvedUnderlyingToken.contractAddress
            ? toTokenAddress(resolvedUnderlyingToken.contractAddress)
            : undefined;
    const depositableBalanceFiatAmount = useSelector(state =>
        selectFiatFromCryptoValue(
            state,
            depositableBalance,
            account.symbol,
            underlyingTokenAddress,
        ),
    );

    const bonusRewards = useMemo<YieldVaultBonusRewardRate[]>(
        () =>
            getBonusRewards(vault).map(({ token: bonusToken, rate }) => {
                const address = bonusToken.address
                    ? toTokenAddress(
                          getContractAddressForNetworkSymbol(account.symbol, bonusToken.address),
                      )
                    : null;

                return {
                    token: {
                        symbol: toTokenSymbol(bonusToken.symbol),
                        decimals: bonusToken.decimals,
                        address,
                    },
                    rate,
                    fiatRateKey: address
                        ? getFiatRateKey(account.symbol, baseCurrencyCode, address)
                        : null,
                };
            }),
        [vault, account.symbol, baseCurrencyCode],
    );

    const bonusRewardFiatRateKeys = useMemo(
        () => bonusRewards.flatMap(({ fiatRateKey }) => (fiatRateKey ? [fiatRateKey] : [])),
        [bonusRewards],
    );

    const bonusRewardRates = useSelector(state =>
        selectCurrentFiatRatesByFiatRateKeys(state, bonusRewardFiatRateKeys),
    );

    const missingBonusRateTickers = useMemo<TickerId[]>(
        () =>
            bonusRewards.flatMap(({ token: bonusToken, fiatRateKey }) =>
                bonusToken.address && fiatRateKey && !bonusRewardRates[fiatRateKey]?.rate
                    ? [{ symbol: account.symbol, tokenAddress: bonusToken.address }]
                    : [],
            ),
        [bonusRewards, bonusRewardRates, account.symbol],
    );

    useMissingRateTickersQuery({
        missingRateTickers: missingBonusRateTickers,
        baseCurrencyCode,
    });

    const totalBonusRate = bonusRewards.reduce((sum, { rate }) => sum + rate, 0);
    const underlyingRewardRate = vault.rewardRate.total - totalBonusRate;

    const getBonusRewardAmounts = (
        depositFiatAmount: BaseCurrencyAmount | null,
    ): YieldVaultBonusReward[] =>
        bonusRewards.map(({ token: bonusToken, rate, fiatRateKey }) => ({
            token: bonusToken,
            crypto: getBonusRewardAmount({
                depositFiatAmount,
                bonusRate: rate,
                bonusTokenRate: fiatRateKey ? bonusRewardRates[fiatRateKey]?.rate : undefined,
            }),
        }));

    const yearlyRewards = new BigNumber(positionInUnderlying)
        .times(underlyingRewardRate)
        .toString();

    const yearlyRewardsInFiat =
        apy === null
            ? null
            : getRewardsFiatAmount({
                  depositFiatAmount: fiatAmount,
                  underlyingRate: underlyingRewardRate,
                  bonusRate: totalBonusRate,
              });

    const potentialRewards = new BigNumber(depositableBalance)
        .times(underlyingRewardRate)
        .toString();

    const potentialRewardsInFiat =
        apy === null
            ? null
            : getRewardsFiatAmount({
                  depositFiatAmount: depositableBalanceFiatAmount,
                  underlyingRate: underlyingRewardRate,
                  bonusRate: totalBonusRate,
              });

    const hasPositionInUnderlying = new BigNumber(positionInUnderlying).gt(0);
    const hasDepositableBalance = new BigNumber(depositableBalance).gt(0);

    const depositMessageSystem = useMessageSystemYield('deposit', { vaultContractAddress });
    const withdrawMessageSystem = useMessageSystemYield('withdraw', { vaultContractAddress });

    const context = {
        account,
        vault,
        hasVaultPosition,
        positionInUnderlying,
        hasPositionInUnderlying,
        depositableBalance,
        hasDepositableBalance,
        fiatAmount,
        apy,
        yearlyRewards: {
            crypto: yearlyRewards,
            fiat: yearlyRewardsInFiat,
            bonus: getBonusRewardAmounts(fiatAmount),
        },
        potentialRewards: {
            crypto: potentialRewards,
            fiat: potentialRewardsInFiat,
            bonus: getBonusRewardAmounts(depositableBalanceFiatAmount),
        },
        underlyingToken: {
            vaultToken: vault.token,
            balance: depositableBalance,
            symbol: underlyingTokenSymbol,
            decimals: underlyingTokenDecimals,
        },
        receiptToken: {
            vaultToken: vault.outputToken,
            balance: receiptTokenBalance,
            symbol: receiptTokenSymbol,
            decimals: receiptTokenDecimals,
        },
        messageSystem: {
            deposit: depositMessageSystem,
            withdraw: withdrawMessageSystem,
        },
    };

    return (
        <YieldVaultDetailContext.Provider value={context}>
            {children}
        </YieldVaultDetailContext.Provider>
    );
};

export const useYieldVaultDetail = () => {
    const context = useContext(YieldVaultDetailContext);

    if (!context) {
        throw new Error('useYieldVaultDetail must be used within a YieldVaultDetailContext');
    }

    return context;
};
