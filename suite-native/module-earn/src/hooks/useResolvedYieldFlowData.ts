import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    type YieldDtoV2,
    getProtocolIncentiveRewardTokens,
    useAllYieldOpportunities,
} from '@suite-common/earn-stablecoin-api';
import { getNetworkByYieldXyzId, isWrappedNativeToken } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type YieldFlowDisplayToken,
    type YieldFlowResolvedData,
    type YieldFlowToken,
    getStablecoinYieldFlowKey,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type Account, type TokenSymbol, toTokenSymbol } from '@suite-common/wallet-types';
import { getApyPercent, getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';
import { type YieldFlowParams } from '@suite-native/navigation';
import { capitalizeFirstLetter } from '@trezor/utils';

import { getAccountTokenByContract } from '../utils/contractTokenBalanceUtils';

export type YieldFlowResolutionStatus =
    'resolved' | 'missing-vault' | 'missing-network' | 'missing-account' | 'missing-token';

type UnresolvedYieldFlowData = {
    account: Account | null;
    apy: number | null;
    bonusRewardTokenSymbol: string | null;
    flowKey: string | null;
    isWrappedNativeVault: boolean;
    providerName: string | null;
    receiptToken: YieldFlowDisplayToken | null;
    resolutionStatus: Exclude<YieldFlowResolutionStatus, 'resolved'>;
    flowData: YieldFlowResolvedData | null;
    depositedSharesAmount: string | null;
    token: YieldFlowToken | null;
    tokenSymbol: TokenSymbol | null;
    vault: YieldDtoV2 | null;
    vaultTokenName: string | null;
    vaultTokenSymbol: string | null;
    vaultName: string | null;
};

type YieldFlowDataResolved = {
    account: Account;
    apy: number | null;
    bonusRewardTokenSymbol: string | null;
    flowKey: string;
    isWrappedNativeVault: boolean;
    providerName: string;
    receiptToken: YieldFlowDisplayToken;
    flowData: YieldFlowResolvedData;
    resolutionStatus: 'resolved';
    depositedSharesAmount: string;
    token: YieldFlowToken;
    tokenSymbol: TokenSymbol;
    vault: YieldDtoV2;
    vaultTokenName: string;
    vaultTokenSymbol: string;
    vaultName: string;
};

export type ResolvedYieldFlowData = UnresolvedYieldFlowData | YieldFlowDataResolved;

type ResolveYieldFlowDataParams = {
    account: Account | null;
    tokenContract: string;
    yieldId?: string;
    yieldOpportunities: YieldDtoV2[];
};

type YieldFlowProps = { displayError?: boolean } & YieldFlowParams;

const defaultFlowData: ResolvedYieldFlowData = {
    account: null,
    apy: null,
    bonusRewardTokenSymbol: null,
    flowKey: null,
    isWrappedNativeVault: false,
    providerName: null,
    receiptToken: null,
    resolutionStatus: 'missing-vault',
    depositedSharesAmount: null,
    token: null,
    flowData: null,
    tokenSymbol: null,
    vault: null,
    vaultTokenName: null,
    vaultTokenSymbol: null,
    vaultName: null,
};

export const resolveYieldFlowData = ({
    account,
    tokenContract,
    yieldId,
    yieldOpportunities,
}: ResolveYieldFlowDataParams): ResolvedYieldFlowData => {
    if (!account) {
        return {
            ...defaultFlowData,
            resolutionStatus: 'missing-account',
        };
    }

    const normalizedContract = getContractAddressForNetworkSymbol(account.symbol, tokenContract);

    const vault = yieldId
        ? yieldOpportunities.find(opportunity => opportunity.id === yieldId)
        : yieldOpportunities.find(
              opportunity =>
                  opportunity.outputToken?.address &&
                  getContractAddressForNetworkSymbol(
                      account.symbol,
                      opportunity.outputToken.address,
                  ) === normalizedContract,
          );

    if (!vault?.outputToken?.address) {
        return defaultFlowData;
    }

    const network = getNetworkByYieldXyzId(vault.network);
    const apy = getApyPercent(vault.rewardRate.total);
    const providerName = capitalizeFirstLetter(vault.providerId);
    const vaultTokenName = vault.outputToken?.name;
    const vaultTokenSymbol = vault.outputToken.symbol;
    const vaultName = vault.metadata.name ?? vaultTokenName;
    // Protocol-incentive rewards (e.g. MORPHO) are the ones claimed manually; their presence
    // gates both the bonus-reward benefit bullet and the "Claim rewards" timeline section,
    // matching the desktop nutshell modal.
    const [protocolIncentiveRewardToken] = getProtocolIncentiveRewardTokens(
        vault.rewardRate.components,
    );
    const resolvedVaultData = {
        apy,
        bonusRewardTokenSymbol: protocolIncentiveRewardToken?.symbol ?? null,
        providerName,
        tokenSymbol: toTokenSymbol(vault.token.symbol),
        vault,
        vaultTokenName,
        vaultTokenSymbol,
        vaultName,
    };

    if (!network) {
        return {
            ...defaultFlowData,
            ...resolvedVaultData,
            resolutionStatus: 'missing-network',
        };
    }
    const underlyingTokenContract = vault.token.address
        ? getContractAddressForNetworkSymbol(account.symbol, vault.token.address)
        : normalizedContract;
    const outputTokenContract = getContractAddressForNetworkSymbol(
        account.symbol,
        vault.outputToken.address,
    );
    const token = getAccountTokenByContract(account, underlyingTokenContract);
    const outputToken = getAccountTokenByContract(account, outputTokenContract);

    if (!outputToken && !yieldId) {
        return {
            ...defaultFlowData,
            account,
            ...resolvedVaultData,
            resolutionStatus: 'missing-token',
        };
    }

    const receiptToken = {
        symbol: outputToken?.symbol ?? vault.outputToken.symbol,
        decimals: outputToken?.decimals ?? vault.outputToken.decimals,
        contractAddress: outputToken?.contract ?? vault.outputToken.address,
        coingeckoId: vault.outputToken.coinGeckoId ?? vault.token.coinGeckoId,
    };

    const tokenSymbol = toTokenSymbol((token?.symbol ?? vault.token.symbol).toUpperCase());
    const flowKey = getStablecoinYieldFlowKey({
        tokenContract: yieldId ? underlyingTokenContract : normalizedContract,
        accountKey: account.key,
        yieldId: vault.id,
    });

    const flowData: YieldFlowResolvedData = {
        vault,
        account,
        token: {
            balance: token?.balance ?? '0',
            contractAddress: token?.contract ?? underlyingTokenContract,
            decimals: token?.decimals ?? vault.token.decimals,
            networkSymbol: account.symbol,
            symbol: token?.symbol ?? tokenSymbol,
        },
        receiptToken: {
            contractAddress: receiptToken.contractAddress,
            decimals: receiptToken.decimals,
            networkSymbol: account.symbol,
            symbol: receiptToken.symbol,
        },
    };

    return {
        ...resolvedVaultData,
        ...flowData,
        flowData,
        flowKey,
        isWrappedNativeVault: isWrappedNativeToken(account.symbol, underlyingTokenContract),
        resolutionStatus: 'resolved',
        depositedSharesAmount: outputToken?.balance ?? '0',
        tokenSymbol,
    };
};

const emptyYieldOpportunities: YieldDtoV2[] = [];

export const useResolvedYieldFlowData = ({
    accountKey,
    tokenContract,
    displayError = true,
    yieldId,
}: YieldFlowProps) => {
    const { data: yieldOpportunities } = useAllYieldOpportunities();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const navigation = useNavigation();
    const hasDisplayedAlertRef = useRef(false);

    const resolvedFlowData = useMemo(
        () =>
            resolveYieldFlowData({
                account,
                tokenContract,
                yieldId,
                yieldOpportunities: yieldOpportunities ?? emptyYieldOpportunities,
            }),
        [account, tokenContract, yieldId, yieldOpportunities],
    );

    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    useEffect(() => {
        if (
            !displayError ||
            resolvedFlowData.resolutionStatus === 'resolved' ||
            hasDisplayedAlertRef.current
        ) {
            return;
        }

        hasDisplayedAlertRef.current = true;

        // TODO: replace with better error handler
        showAlert({
            title: 'Yield not available',
            description: 'This stablecoin yield flow is not available right now.',
            primaryButtonTitle: translate('generic.buttons.close'),
            onPressPrimaryButton: handleGoBack,
        });
    }, [displayError, handleGoBack, resolvedFlowData.resolutionStatus, showAlert, translate]);

    return resolvedFlowData;
};
