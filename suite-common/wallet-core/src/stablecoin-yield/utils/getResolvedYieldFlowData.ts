import {
    type TokenDtoV2,
    type YieldDtoV2,
    getProtocolIncentiveRewardTokens,
} from '@suite-common/earn-stablecoin-api';
import {
    getNetworkByYieldXyzId,
    getNetworkDisplaySymbol,
    isWrappedNativeToken,
} from '@suite-common/wallet-config';
import { type Account, type TokenSymbol, toTokenSymbol } from '@suite-common/wallet-types';
import { getApyPercent, getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import {
    type YieldFlowDisplayToken,
    type YieldFlowResolvedData,
    type YieldFlowToken,
} from '../stablecoinYieldTypes';
import {
    doTokensMatch,
    getConvertedOutputTokenBalanceToInputTokenAmount,
    getStablecoinYieldFlowKey,
} from './stablecoinYieldUtils';

export type YieldFlowResolutionStatus =
    'resolved' | 'missing-account' | 'missing-vault' | 'missing-network';

type AccountToken = NonNullable<Account['tokens']>[number];

type GetMatchedAccountTokenParams = {
    account: Account;
    contractAddress: string | null;
    token: Pick<TokenDtoV2, 'address' | 'symbol' | 'decimals'> | undefined;
};

export const getMatchedAccountToken = ({
    account,
    contractAddress,
    token,
}: GetMatchedAccountTokenParams): AccountToken | undefined => {
    if (!account.tokens?.length) {
        return undefined;
    }

    return account.tokens.find(accountToken => {
        if (contractAddress) {
            return (
                getContractAddressForNetworkSymbol(account.symbol, accountToken.contract) ===
                contractAddress
            );
        }

        return doTokensMatch({
            networkSymbol: account.symbol,
            firstToken: {
                address: accountToken.contract,
                symbol: accountToken.symbol ?? '',
                decimals: accountToken.decimals ?? 0,
            },
            secondToken: token,
        });
    });
};

type YieldVaultDisplayData = {
    apy: number | null;
    bonusRewardTokenSymbol: string | null;
    providerName: string;
    vaultName: string;
    vaultTokenName: string;
    vaultTokenSymbol: string;
};

type UnresolvedYieldFlowData = {
    resolutionStatus: Exclude<YieldFlowResolutionStatus, 'resolved'>;
    account: Account | null;
    vault: YieldDtoV2 | null;
    token: YieldFlowToken | null;
    receiptToken: YieldFlowDisplayToken | null;
    flowData: YieldFlowResolvedData | null;
    flowKey: string | null;
    apy: number | null;
    depositedAmount: string | null;
    depositedSharesAmount: string | null;
    isWrappedNativeVault: boolean;
    wrappedNativeSymbol: string | null;
    bonusRewardTokenSymbol: string | null;
    providerName: string | null;
    tokenSymbol: TokenSymbol | null;
    vaultName: string | null;
    vaultTokenName: string | null;
    vaultTokenSymbol: string | null;
};

type FullyResolvedYieldFlowData = YieldVaultDisplayData & {
    resolutionStatus: 'resolved';
    account: Account;
    vault: YieldDtoV2;
    token: YieldFlowToken;
    receiptToken: YieldFlowDisplayToken;
    flowData: YieldFlowResolvedData;
    flowKey: string;
    depositedAmount: string;
    depositedSharesAmount: string;
    isWrappedNativeVault: boolean;
    wrappedNativeSymbol: string | null;
    tokenSymbol: TokenSymbol;
};

export type ResolvedYieldFlowData = UnresolvedYieldFlowData | FullyResolvedYieldFlowData;

export interface GetResolvedYieldFlowDataProps {
    account: Account | null | undefined;
    vault: YieldDtoV2 | null | undefined;
    tokenContract?: string | null;
}

const unresolvedYieldFlowData: UnresolvedYieldFlowData = {
    resolutionStatus: 'missing-vault',
    account: null,
    vault: null,
    token: null,
    receiptToken: null,
    flowData: null,
    flowKey: null,
    apy: null,
    depositedAmount: null,
    depositedSharesAmount: null,
    isWrappedNativeVault: false,
    wrappedNativeSymbol: null,
    bonusRewardTokenSymbol: null,
    providerName: null,
    tokenSymbol: null,
    vaultName: null,
    vaultTokenName: null,
    vaultTokenSymbol: null,
};

export const getResolvedYieldFlowData = ({
    account,
    vault,
    tokenContract,
}: GetResolvedYieldFlowDataProps): ResolvedYieldFlowData => {
    if (!account) {
        return { ...unresolvedYieldFlowData, resolutionStatus: 'missing-account' };
    }

    if (!vault?.outputToken?.address) {
        return { ...unresolvedYieldFlowData, account };
    }

    const [protocolIncentiveRewardToken] = getProtocolIncentiveRewardTokens(
        vault.rewardRate.components,
    );
    const vaultTokenName = vault.outputToken.name;

    const vaultDisplayData: YieldVaultDisplayData = {
        apy: getApyPercent(vault.rewardRate.total),
        bonusRewardTokenSymbol: protocolIncentiveRewardToken?.symbol ?? null,
        providerName: capitalizeFirstLetter(vault.providerId),
        vaultName: vault.metadata.name ?? vaultTokenName,
        vaultTokenName,
        vaultTokenSymbol: vault.outputToken.symbol,
    };

    if (!getNetworkByYieldXyzId(vault.network)) {
        return {
            ...unresolvedYieldFlowData,
            ...vaultDisplayData,
            account,
            vault,
            resolutionStatus: 'missing-network',
        };
    }

    const addressedContract = tokenContract
        ? getContractAddressForNetworkSymbol(account.symbol, tokenContract)
        : null;
    const underlyingTokenContract = vault.token.address
        ? getContractAddressForNetworkSymbol(account.symbol, vault.token.address)
        : addressedContract;
    const receiptTokenContract = getContractAddressForNetworkSymbol(
        account.symbol,
        vault.outputToken.address,
    );

    const matchedToken = getMatchedAccountToken({
        account,
        contractAddress: underlyingTokenContract,
        token: vault.token,
    });
    const matchedReceiptToken = getMatchedAccountToken({
        account,
        contractAddress: receiptTokenContract,
        token: vault.outputToken,
    });

    const token: YieldFlowToken = {
        networkSymbol: account.symbol,
        symbol:
            matchedToken?.symbol ?? vault.token.symbol ?? getNetworkDisplaySymbol(account.symbol),
        decimals: matchedToken?.decimals ?? vault.token.decimals,
        contractAddress: matchedToken?.contract ?? underlyingTokenContract,
        coingeckoId: vault.token.coinGeckoId,
        balance: matchedToken?.balance ?? '0',
    };

    const receiptToken: YieldFlowDisplayToken = {
        networkSymbol: account.symbol,
        symbol: matchedReceiptToken?.symbol ?? vault.outputToken.symbol,
        decimals: matchedReceiptToken?.decimals ?? vault.outputToken.decimals,
        contractAddress: matchedReceiptToken?.contract ?? receiptTokenContract,
        coingeckoId: vault.outputToken.coinGeckoId ?? vault.token.coinGeckoId,
    };

    const flowData: YieldFlowResolvedData = { account, vault, token, receiptToken };
    const depositedSharesAmount = matchedReceiptToken?.balance ?? '0';
    const isWrappedNativeVault = isWrappedNativeToken(account.symbol, underlyingTokenContract);

    return {
        ...vaultDisplayData,
        resolutionStatus: 'resolved',
        account,
        vault,
        token,
        receiptToken,
        flowData,
        flowKey: getStablecoinYieldFlowKey({
            accountKey: account.key,
            tokenContract: addressedContract ?? underlyingTokenContract,
            yieldId: vault.id,
        }),
        depositedAmount: getConvertedOutputTokenBalanceToInputTokenAmount({
            networkSymbol: account.symbol,
            token: vault.token,
            outputToken: vault.outputToken,
            outputTokenBalance: depositedSharesAmount,
            pricePerShareState: vault.state?.pricePerShareState,
        }),
        depositedSharesAmount,
        isWrappedNativeVault,
        wrappedNativeSymbol: isWrappedNativeVault ? getNetworkDisplaySymbol(account.symbol) : null,
        tokenSymbol: toTokenSymbol((matchedToken?.symbol ?? vault.token.symbol).toUpperCase()),
    };
};
