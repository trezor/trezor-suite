import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type YieldDto, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';
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

export type YieldFlowResolutionStatus =
    | 'resolved'
    | 'missing-vault'
    | 'missing-network'
    | 'missing-account'
    | 'missing-token';

type UnresolvedYieldFlowData = {
    account: Account | null;
    apy: number | null;
    flowKey: string | null;
    providerName: string | null;
    receiptToken: YieldFlowDisplayToken | null;
    resolutionStatus: Exclude<YieldFlowResolutionStatus, 'resolved'>;
    flowData: YieldFlowResolvedData | null;
    token: YieldFlowToken | null;
    tokenSymbol: TokenSymbol | null;
    vault: YieldDto | null;
    vaultTokenName: string | null;
};

type YieldFlowDataResolved = {
    account: Account;
    apy: number | null;
    flowKey: string;
    providerName: string;
    receiptToken: YieldFlowDisplayToken;
    flowData: YieldFlowResolvedData;
    resolutionStatus: 'resolved';
    token: YieldFlowToken;
    tokenSymbol: TokenSymbol;
    vault: YieldDto;
    vaultTokenName: string;
};

export type ResolvedYieldFlowData = UnresolvedYieldFlowData | YieldFlowDataResolved;

type ResolveYieldFlowDataParams = {
    account: Account | null;
    tokenContract: string;
    yieldOpportunities: YieldDto[];
};

type GetMatchingTokenParams = {
    account: Account;
    tokenContract: string;
};

type YieldFlowProps = { displayError?: boolean } & YieldFlowParams;

const defaultFlowData: ResolvedYieldFlowData = {
    account: null,
    apy: null,
    flowKey: null,
    providerName: null,
    receiptToken: null,
    resolutionStatus: 'missing-vault',
    token: null,
    flowData: null,
    tokenSymbol: null,
    vault: null,
    vaultTokenName: null,
};

const getMatchingToken = ({ account, tokenContract }: GetMatchingTokenParams) =>
    account.tokens?.find(token => {
        const normalizedAccountTokenContract = getContractAddressForNetworkSymbol(
            account.symbol,
            token.contract,
        );

        return normalizedAccountTokenContract === tokenContract;
    }) ?? null;

export const resolveYieldFlowData = ({
    account,
    tokenContract,
    yieldOpportunities,
}: ResolveYieldFlowDataParams): ResolvedYieldFlowData => {
    if (!account) {
        return {
            ...defaultFlowData,
            resolutionStatus: 'missing-account',
        };
    }

    const normalizedContract = getContractAddressForNetworkSymbol(account.symbol, tokenContract);

    const vault = yieldOpportunities.find(
        v =>
            v.outputToken?.address &&
            getContractAddressForNetworkSymbol(account.symbol, v.outputToken.address) ===
                normalizedContract,
    );

    if (!vault?.outputToken) {
        return defaultFlowData;
    }

    const network = getNetworkByYieldXyzId(vault.network);
    const apy = getApyPercent(vault.rewardRate.total);
    const providerName = capitalizeFirstLetter(vault.providerId);
    const vaultTokenName = vault.outputToken?.name;
    const resolvedVaultData = {
        apy,
        providerName,
        tokenSymbol: toTokenSymbol(vault.token.symbol.toUpperCase()),
        vault,
        vaultTokenName,
    };

    if (!network) {
        return {
            ...defaultFlowData,
            ...resolvedVaultData,
            resolutionStatus: 'missing-network',
        };
    }
    const token = getMatchingToken({
        account,
        tokenContract: normalizedContract,
    });

    if (!token) {
        return {
            ...defaultFlowData,
            account,
            ...resolvedVaultData,
            resolutionStatus: 'missing-token',
        };
    }

    const receiptToken = {
        symbol: vault.outputToken.symbol,
        decimals: vault.outputToken.decimals,
        contractAddress: vault.outputToken.address,
        coingeckoId: vault.outputToken.coinGeckoId ?? vault.token.coinGeckoId,
    };
    const tokenSymbol = toTokenSymbol(
        token.symbol?.toUpperCase() ?? vault.token.symbol.toUpperCase(),
    );
    const flowKey = getStablecoinYieldFlowKey({
        tokenContract,
        accountKey: account.key,
        yieldId: vault.id,
    });

    const flowData: YieldFlowResolvedData = {
        vault,
        account,
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
        ...flowData,
        flowData,
        flowKey,
        resolutionStatus: 'resolved',
        tokenSymbol,
    };
};

export const useResolvedYieldFlowData = ({
    accountKey,
    tokenContract,
    displayError = true,
}: YieldFlowProps) => {
    const { yieldOpportunities } = useAllYieldOpportunities();
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
                yieldOpportunities,
            }),
        [account, tokenContract, yieldOpportunities],
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
