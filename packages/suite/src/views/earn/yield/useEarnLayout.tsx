import { useEffect } from 'react';

import { type TranslationKey } from '@suite/intl';
import { type EarnParams, goto } from '@suite/router';
import { selectSelectedDevice } from '@suite-common/device';
import { type YieldDtoV2, useGetVaultByAddress } from '@suite-common/earn-stablecoin-api';
import { useDispatch } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { type EarnAnalyticsStep } from '@suite-common/suite-types/src/staking';
import { getNetworkByYieldXyzId, getNetworkOptional } from '@suite-common/wallet-config';
import {
    type YieldPositionFlowType,
    getYieldVaultContractAddress,
    isStablecoinYieldSupported,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

import { YieldPageHeader } from 'src/components/earn';
import { useEarnRouteAccount } from 'src/components/earn/utils/useEarnRouteAccount';
import { useLayout, useSelector } from 'src/hooks/suite';
import { type EarnLayoutState } from 'src/types/earn/earnLayout';

type EarnYieldAnalyticsStep = Extract<EarnAnalyticsStep, 'yield-deposit' | 'yield-withdraw'>;

type UseEarnLayoutParams = {
    type: YieldPositionFlowType;
    fallbackTitleId: TranslationKey;
};

type GetEarnLayoutResultParams = {
    account?: Account;
    device?: TrezorDevice;
    routeParams?: EarnParams;
    vault?: YieldDtoV2;
    type: YieldPositionFlowType;
    isYieldOpportunitiesLoading: boolean;
    isYieldOpportunitiesSuccess: boolean;
    isYieldOpportunitiesError: boolean;
};

type VaultValidationParams = {
    account: Account;
    vault?: YieldDtoV2;
};

type VaultAddressValidationParams = VaultValidationParams & {
    routeParams: EarnParams;
};

const getAnalyticsStep = (type: YieldPositionFlowType): EarnYieldAnalyticsStep => {
    switch (type) {
        case 'deposit':
            return 'yield-deposit';
        case 'withdraw':
        case 'redeem':
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

// The vault is looked up by the address in the route, so this only guards against a backend
// returning something other than what was asked for.
const isVaultAddressMismatch = ({
    account,
    routeParams,
    vault,
}: VaultAddressValidationParams): boolean => {
    if (!vault) {
        return false;
    }

    const vaultAddress = getYieldVaultContractAddress(vault);

    if (!vaultAddress || !routeParams.vaultAddress) {
        return true;
    }

    return (
        getContractAddressForNetworkSymbol(account.symbol, vaultAddress) !==
        getContractAddressForNetworkSymbol(account.symbol, routeParams.vaultAddress)
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

    if (isVaultAddressMismatch({ account, routeParams, vault })) {
        return { status: 'invalid', reason: 'missing-vault' };
    }

    if (
        device &&
        !isStablecoinYieldSupported(device, {
            flowType: type,
            vaultToken: { networkSymbol: account.symbol, contractAddress: vault.token.address },
        })
    ) {
        return { status: 'invalid', reason: 'firmware-not-supported' };
    }

    return { status: 'valid', account, vault };
};

export const useEarnLayout = ({ type, fallbackTitleId }: UseEarnLayoutParams): EarnLayoutState => {
    const analyticsStep = getAnalyticsStep(type);
    const dispatch = useDispatch();
    const { account, routeParams } = useEarnRouteAccount();
    const selectedDevice = useSelector(selectSelectedDevice);
    // Normalized so a hand-written URL resolves the same vault as one the app produced.
    const vaultAddress = routeParams?.vaultAddress
        ? getContractAddressForNetworkSymbol(routeParams.symbol, routeParams.vaultAddress)
        : undefined;
    const {
        data: vault,
        isLoading,
        isSuccess,
        isError,
    } = useGetVaultByAddress({
        enabled: true,
        outputToken: vaultAddress,
        network: getNetworkOptional(routeParams?.symbol)?.yieldXyzId ?? undefined,
    });

    useEffect(() => {
        if (!routeParams) {
            dispatch(goto({ routeName: 'suite-earn' }));
        }
    }, [dispatch, routeParams]);

    const layoutState = getEarnLayoutResult({
        account,
        device: selectedDevice,
        routeParams,
        vault: vault ?? undefined,
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
