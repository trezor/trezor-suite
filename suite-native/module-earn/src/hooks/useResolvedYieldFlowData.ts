import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type YieldDto, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type YieldFlowResolvedData as StablecoinYieldFlowData,
    getStablecoinYieldFlowKey,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type Account, type TokenSymbol, toTokenSymbol } from '@suite-common/wallet-types';
import { getApyPercent } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';
import { type YieldFlowParams } from '@suite-native/navigation';
import { capitalizeFirstLetter } from '@trezor/utils';

type YieldFlowToken = NonNullable<Account['tokens']>[number];

export type YieldFlowResolutionStatus =
    | 'resolved'
    | 'missing-vault'
    | 'missing-network'
    | 'missing-account'
    | 'missing-token';

type YieldFlowReceiptToken = {
    symbol: string;
    decimals: number;
    contractAddress: string | null;
    coingeckoId?: string;
};

export type ResolvedYieldFlowData = {
    account: Account | null;
    apy: number | null;
    flowData: StablecoinYieldFlowData | null;
    flowKey: string | null;
    providerName: string | null;
    receiptToken: YieldFlowReceiptToken | null;
    resolutionStatus: YieldFlowResolutionStatus;
    token: YieldFlowToken | null;
    tokenSymbol: TokenSymbol | null;
    vault: YieldDto | null;
    vaultTokenName: string | null;
};

type ResolveYieldFlowDataParams = {
    account: Account | null;
    params: YieldFlowParams;
    yieldOpportunities: YieldDto[];
};

const normalizeContractAddress = (value: string) => value.toLowerCase();

const defaultFlowData: ResolvedYieldFlowData = {
    account: null,
    apy: null,
    flowData: null,
    flowKey: null,
    providerName: null,
    receiptToken: null,
    resolutionStatus: 'missing-vault',
    token: null,
    tokenSymbol: null,
    vault: null,
    vaultTokenName: null,
};

const getMatchingToken = ({
    account,
    tokenContract,
}: {
    account: Account;
    tokenContract: string;
}) => {
    const normalizedTokenContract = normalizeContractAddress(tokenContract);

    return (
        account.tokens?.find(token => {
            const normalizedAccountTokenContract = normalizeContractAddress(token.contract);

            return normalizedAccountTokenContract === normalizedTokenContract;
        }) ?? null
    );
};

export const resolveYieldFlowData = ({
    account,
    params,
    yieldOpportunities,
}: ResolveYieldFlowDataParams): ResolvedYieldFlowData => {
    const vault = yieldOpportunities.find(
        yieldOpportunity => yieldOpportunity.id === params.yieldId,
    );

    if (!vault) {
        return defaultFlowData;
    }

    const network = getNetworkByYieldXyzId(vault.network);
    const apy = getApyPercent(vault.rewardRate.total);
    const providerName = capitalizeFirstLetter(vault.providerId);
    const vaultTokenName = vault.outputToken?.name ?? null;
    const resolvedVaultData = {
        ...defaultFlowData,
        apy,
        providerName,
        resolutionStatus: 'missing-network' as const,
        tokenSymbol: toTokenSymbol(vault.token.symbol.toUpperCase()),
        vault,
        vaultTokenName,
    };

    if (!network) {
        return resolvedVaultData;
    }

    if (!account) {
        return {
            ...resolvedVaultData,
            resolutionStatus: 'missing-account',
        };
    }

    const token = getMatchingToken({
        account,
        tokenContract: params.tokenContract,
    });

    if (!token) {
        return {
            ...resolvedVaultData,
            account,
            resolutionStatus: 'missing-token',
        };
    }

    const receiptToken = {
        symbol: vault.outputToken?.symbol ?? token.symbol ?? vault.token.symbol,
        decimals: vault.outputToken?.decimals ?? token.decimals ?? vault.token.decimals,
        contractAddress: vault.outputToken?.address ?? null,
        coingeckoId: vault.outputToken?.coinGeckoId ?? vault.token.coinGeckoId,
    };
    const tokenSymbol = toTokenSymbol(
        token.symbol?.toUpperCase() ?? vault.token.symbol.toUpperCase(),
    );
    const flowKey = getStablecoinYieldFlowKey({ ...params, accountKey: account.key });
    const flowData: StablecoinYieldFlowData = {
        account,
        vault,
        token: {
            balance: token.balance ?? '0',
            contractAddress: token.contract,
            decimals: token.decimals,
            networkSymbol: account.symbol,
            symbol: token.symbol ?? tokenSymbol,
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
        account,
        flowData,
        flowKey,
        receiptToken,
        resolutionStatus: 'resolved',
        token,
        tokenSymbol,
    };
};

export const useResolvedYieldFlowData = (params: YieldFlowParams) => {
    const { yieldOpportunities } = useAllYieldOpportunities();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, params.accountKey),
    );
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const navigation = useNavigation();
    const hasDisplayedAlertRef = useRef(false);

    const resolvedFlowData = useMemo(
        () =>
            resolveYieldFlowData({
                account,
                params,
                yieldOpportunities,
            }),
        [account, params, yieldOpportunities],
    );

    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    useEffect(() => {
        if (resolvedFlowData.resolutionStatus === 'resolved' || hasDisplayedAlertRef.current) {
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
    }, [handleGoBack, resolvedFlowData.resolutionStatus, showAlert, translate]);

    return resolvedFlowData;
};
