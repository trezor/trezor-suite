import { type ReactNode, useEffect } from 'react';

import { type TranslationKey } from '@suite/intl';
import { type EarnParams, goto } from '@suite/router';
import { useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { type EarnAnalyticsStep } from '@suite-common/suite-types/src/staking';
import { type YieldActionFlowType } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

import { TokenNotExists, VaultLoading, VaultNotExists, YieldPageHeader } from 'src/components/earn';
import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { AccountNotExists } from 'src/components/wallet/WalletLayout/AccountException/AccountNotExists';
import { useDispatch, useLayout } from 'src/hooks/suite';

type EarnYieldAnalyticsStep = Extract<EarnAnalyticsStep, 'yield-supply' | 'yield-withdraw'>;

type UseEarnLayoutParams = {
    type: YieldActionFlowType;
    fallbackTitleId: TranslationKey;
};

type UseEarnLayoutResult =
    | { isValid: true; account: Account; routeParams: EarnParams }
    | { isValid: false; fallback: ReactNode };

const getAnalyticsStep = (type: YieldActionFlowType): EarnYieldAnalyticsStep => {
    switch (type) {
        case 'deposit':
            return 'yield-supply';
        case 'withdraw':
            return 'yield-withdraw';
    }
};

export const useEarnLayout = ({
    type,
    fallbackTitleId,
}: UseEarnLayoutParams): UseEarnLayoutResult => {
    const analyticsStep = getAnalyticsStep(type);
    const dispatch = useDispatch();
    const { account, routeParams } = useEarnRouteAccount();
    const {
        yieldOpportunities,
        isLoading: isYieldOpportunitiesLoading,
        isSuccess: isYieldOpportunitiesSuccess,
    } = useAllYieldOpportunities();

    useEffect(() => {
        if (!routeParams) {
            dispatch(goto({ routeName: 'suite-earn' }));
        }
    }, [dispatch, routeParams]);

    useLayout(
        'Earn',
        <YieldPageHeader
            analyticsStep={analyticsStep}
            fallbackTitleId={fallbackTitleId}
            account={account}
            routeParams={routeParams}
        />,
    );

    if (!routeParams) {
        return { isValid: false, fallback: null };
    }

    if (!account) {
        return { isValid: false, fallback: <AccountNotExists /> };
    }

    if (isYieldOpportunitiesLoading) {
        return { isValid: false, fallback: <VaultLoading /> };
    }

    const vault = isYieldOpportunitiesSuccess
        ? yieldOpportunities.find(opportunity => opportunity.id === routeParams.yieldId)
        : undefined;

    if (isYieldOpportunitiesSuccess && !vault) {
        return { isValid: false, fallback: <VaultNotExists /> };
    }

    if (vault?.token.address && routeParams.contractAddress) {
        const isTokenMismatch =
            getContractAddressForNetworkSymbol(account.symbol, vault.token.address) !==
            getContractAddressForNetworkSymbol(account.symbol, routeParams.contractAddress);

        if (isTokenMismatch) {
            return { isValid: false, fallback: <TokenNotExists /> };
        }
    }

    return { isValid: true, account, routeParams };
};
