import { useEffect } from 'react';

import { type TranslationKey } from '@suite/intl';
import { type EarnParams, goto } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { type YieldDto } from '@suite-common/earn-stablecoin-api';
import { useYieldOpportunity } from '@suite-common/earn-stablecoin-api';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type EarnAnalyticsStep } from '@suite-common/suite-types/src/staking';
import { getNetworkByYieldXyzId } from '@suite-common/wallet-config';
import { type YieldActionFlowType, isStablecoinYieldSupported } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

import { YieldPageHeader } from 'src/components/earn';
import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { useDispatch, useLayout, useSelector } from 'src/hooks/suite';
import { type EarnLayoutState } from 'src/types/earn/earnLayout';

type EarnYieldAnalyticsStep = Extract<EarnAnalyticsStep, 'yield-deposit' | 'yield-withdraw'>;

type UseEarnLayoutParams = {
    type: YieldActionFlowType;
    fallbackTitleId: TranslationKey;
};

type GetEarnLayoutResultParams = {
    account?: Account;
    device?: TrezorDevice;
    routeParams?: EarnParams;
    vault?: YieldDto;
    type: YieldActionFlowType;
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
            return 'yield-deposit';
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
    device,
    routeParams,
    vault,
    type,
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

    if (device && !isStablecoinYieldSupported(device, type)) {
        return { status: 'invalid', reason: 'firmware-not-supported' };
    }

    return { status: 'valid', account, routeParams, vault };
};

export const useEarnLayout = ({ type, fallbackTitleId }: UseEarnLayoutParams): EarnLayoutState => {
    const analyticsStep = getAnalyticsStep(type);
    const dispatch = useDispatch();
    const { account, routeParams } = useEarnRouteAccount();
    const selectedDevice = useSelector(selectSelectedDevice);
    const {
        data: vault,
        isLoading,
        isSuccess,
        isError,
    } = useYieldOpportunity(routeParams?.yieldId);

    useEffect(() => {
        if (!routeParams) {
            dispatch(goto({ routeName: 'suite-earn' }));
        }
    }, [dispatch, routeParams]);

    const layoutState = getEarnLayoutResult({
        account,
        device: selectedDevice,
        routeParams,
        vault,
        type,
        isYieldOpportunitiesLoading: isLoading,
        isYieldOpportunitiesSuccess: isSuccess,
        isYieldOpportunitiesError: isError,
    });

    const isFirmwareNotSupported =
        layoutState.status === 'invalid' && layoutState.reason === 'firmware-not-supported';

    useEffect(() => {
        if (isFirmwareNotSupported) {
            dispatch(goto({ routeName: 'suite-earn' }));
        }
    }, [dispatch, isFirmwareNotSupported]);

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
