import { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import {
    type AccountsRootState,
    type ResolvedYieldFlowData,
    getMatchedAccountToken,
    getResolvedYieldFlowData,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';
import { type YieldFlowParams } from '@suite-native/navigation';

type FindYieldFlowVaultParams = {
    account: Account | null | undefined;
    tokenContract: string;
    yieldId?: string;
    yieldOpportunities: YieldDtoV2[];
};

const findYieldFlowVault = ({
    account,
    tokenContract,
    yieldId,
    yieldOpportunities,
}: FindYieldFlowVaultParams): YieldDtoV2 | null => {
    if (!account) return null;

    if (yieldId) {
        return yieldOpportunities.find(opportunity => opportunity.id === yieldId) ?? null;
    }

    const normalizedContract = getContractAddressForNetworkSymbol(account.symbol, tokenContract);

    const vault = yieldOpportunities.find(
        opportunity =>
            opportunity.outputToken?.address &&
            getContractAddressForNetworkSymbol(account.symbol, opportunity.outputToken.address) ===
                normalizedContract,
    );

    if (!vault) return null;

    const holdsReceiptToken = !!getMatchedAccountToken({
        account,
        contractAddress: normalizedContract,
        token: vault.outputToken,
    });

    return holdsReceiptToken ? vault : null;
};

interface UseYieldNotAvailableAlertProps {
    yieldFlowData: ResolvedYieldFlowData;
    displayError?: boolean;
    isFetchingYieldOpportunities?: boolean;
}

const useYieldNotAvailableAlert = ({
    yieldFlowData,
    displayError = true,
    isFetchingYieldOpportunities = false,
}: UseYieldNotAvailableAlertProps) => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const navigation = useNavigation();
    const hasDisplayedAlertRef = useRef(false);

    const { resolutionStatus } = yieldFlowData;

    useEffect(() => {
        if (
            !displayError ||
            isFetchingYieldOpportunities ||
            resolutionStatus === 'resolved' ||
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
            onPressPrimaryButton: navigation.goBack,
        });
    }, [
        displayError,
        navigation,
        isFetchingYieldOpportunities,
        resolutionStatus,
        showAlert,
        translate,
    ]);
};

type UseYieldFlowDataProps = YieldFlowParams & { displayError?: boolean };

export const useYieldFlowData = ({
    accountKey,
    tokenContract,
    displayError = true,
    yieldId,
}: UseYieldFlowDataProps): ResolvedYieldFlowData => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const { data: yieldOpportunities = [], isFetching: isFetchingYieldOpportunities } =
        useAllYieldOpportunities();

    const vault = useMemo(
        () =>
            findYieldFlowVault({
                account,
                tokenContract,
                yieldId,
                yieldOpportunities,
            }),
        [account, tokenContract, yieldId, yieldOpportunities],
    );

    const yieldFlowData = useMemo(
        () => getResolvedYieldFlowData({ account, vault, tokenContract }),
        [account, vault, tokenContract],
    );

    useYieldNotAvailableAlert({ yieldFlowData, displayError, isFetchingYieldOpportunities });

    return yieldFlowData;
};
