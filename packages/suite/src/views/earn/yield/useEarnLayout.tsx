import { useEffect } from 'react';

import { type TranslationKey } from '@suite/intl';
import { type EarnParams, goto } from '@suite/router';
import { type YieldDto, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { type EarnAnalyticsStep } from '@suite-common/suite-types/src/staking';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import { type YieldActionFlowType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

import { YieldPageHeader } from 'src/components/earn';
import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { useDispatch, useLayout } from 'src/hooks/suite';
import { type EarnLayoutState } from 'src/types/earn/earnLayout';

type EarnYieldAnalyticsStep = Extract<EarnAnalyticsStep, 'yield-supply' | 'yield-withdraw'>;

type UseEarnLayoutParams = {
    type: YieldActionFlowType;
    fallbackTitleId: TranslationKey;
};

type GetEarnLayoutResultParams = {
    account?: Account;
    routeParams?: EarnParams;
    vault?: YieldDto;
    isYieldOpportunitiesLoading: boolean;
    isYieldOpportunitiesSuccess: boolean;
    isYieldOpportunitiesError: boolean;
};

type VaultValidationParams = {
    account: Account;
    vault?: YieldDto;
};

type VaultTokenValidationParams = VaultValidationParams & {
    routeParams: EarnParams;
};

const getAnalyticsStep = (type: YieldActionFlowType): EarnYieldAnalyticsStep => {
    switch (type) {
        case 'deposit':
            return 'yield-supply';
        case 'withdraw':
            return 'yield-withdraw';
    }
};

const isVaultNetworkMismatch = ({ account, vault }: VaultValidationParams): boolean => {
    if (!vault) {
        return false;
    }

    const vaultNetwork = getNetworkByYieldXyzId(vault.network);

    return vaultNetwork?.symbol !== account.symbol;
};

const isVaultTokenMismatch = ({
    account,
    routeParams,
    vault,
}: VaultTokenValidationParams): boolean => {
    if (!vault?.token.address) {
        return false;
    }

    if (!routeParams.contractAddress) {
        return true;
    }

    return (
        getContractAddressForNetworkSymbol(account.symbol, vault.token.address) !==
        getContractAddressForNetworkSymbol(account.symbol, routeParams.contractAddress)
    );
};

const getEarnLayoutResult = ({
    account,
    routeParams,
    vault,
    isYieldOpportunitiesLoading,
    isYieldOpportunitiesSuccess,
    isYieldOpportunitiesError,
}: GetEarnLayoutResultParams): EarnLayoutState => {
    if (!routeParams) {
        return { status: 'invalid', reason: 'missing-route-params' };
    }

    if (!account) {
        return { status: 'invalid', reason: 'missing-account' };
    }

    if (isYieldOpportunitiesLoading) {
        return { status: 'loading' };
    }

    if (isYieldOpportunitiesError) {
        return { status: 'invalid', reason: 'yield-opportunities-error' };
    }

    if (!isYieldOpportunitiesSuccess) {
        return { status: 'loading' };
    }

    if (!vault) {
        return { status: 'invalid', reason: 'missing-vault' };
    }

    if (isVaultNetworkMismatch({ account, vault })) {
        return { status: 'invalid', reason: 'network-mismatch' };
    }

    if (isVaultTokenMismatch({ account, routeParams, vault })) {
        return { status: 'invalid', reason: 'token-mismatch' };
    }

    return { status: 'valid', account, routeParams, vault };
};

export const useEarnLayout = ({ type, fallbackTitleId }: UseEarnLayoutParams): EarnLayoutState => {
    const analyticsStep = getAnalyticsStep(type);
    const dispatch = useDispatch();
    const { account, routeParams } = useEarnRouteAccount();
    const {
        yieldOpportunities,
        isLoading: isYieldOpportunitiesLoading,
        isSuccess: isYieldOpportunitiesSuccess,
        isError: isYieldOpportunitiesError,
    } = useAllYieldOpportunities();

    useEffect(() => {
        if (!routeParams) {
            dispatch(goto({ routeName: 'suite-earn' }));
        }
    }, [dispatch, routeParams]);

    const vault =
        isYieldOpportunitiesSuccess && routeParams
            ? yieldOpportunities.find(opportunity => opportunity.id === routeParams.yieldId)
            : undefined;

    const layoutState = getEarnLayoutResult({
        account,
        routeParams,
        vault,
        isYieldOpportunitiesLoading,
        isYieldOpportunitiesSuccess,
        isYieldOpportunitiesError,
    });

    useLayout(
        'Earn',
        <YieldPageHeader
            analyticsStep={analyticsStep}
            fallbackTitleId={fallbackTitleId}
            account={layoutState.status === 'valid' ? layoutState.account : account}
            routeParams={routeParams}
            vault={layoutState.status === 'valid' ? layoutState.vault : undefined}
            isInvalid={layoutState.status !== 'valid'}
        />,
    );

    return layoutState;
};
