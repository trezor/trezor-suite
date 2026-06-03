import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey, type FormState } from '@suite-common/wallet-types';
import {
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { RootStackRoutes } from '@suite-native/navigation';

import { USER_CANCELLED_ERROR_CODES } from './constants';

export const isStakeFlowSupportedSymbol = (symbol: NetworkSymbol): boolean =>
    isSupportedEthStakingNetworkSymbol(symbol) || isSupportedSolStakingNetworkSymbol(symbol);

export const getEarnPostSignParentRoute = (symbol: NetworkSymbol, accountKey: AccountKey) => {
    if (isStakeFlowSupportedSymbol(symbol)) {
        return {
            name: RootStackRoutes.StakingManagement,
            params: { accountKey },
        } as const;
    }

    return {
        name: RootStackRoutes.StakingDetail,
        params: { accountKey },
    } as const;
};

export const buildEarnComposeFormState = (
    contractAddress: string,
    amount: string,
    calldata: string,
): FormState => ({
    outputs: [
        {
            address: contractAddress,
            amount,
            type: 'payment',
            token: null,
            fiat: '',
            currency: { label: '', value: '' },
        },
    ],
    options: ['transactionData'],
    transactionData: calldata,
    isCoinControlEnabled: false,
    hasCoinControlBeenOpened: false,
    selectedUtxos: [],
    selectedFee: 'normal',
    feePerUnit: '',
    feeLimit: '',
});

export const isUserCancelledSignError = (
    payload: { errorCode?: string; message?: string } | undefined,
) =>
    payload?.message === 'tx-cancelled' ||
    (!!payload?.errorCode && USER_CANCELLED_ERROR_CODES.some(code => code === payload.errorCode));

type HandleEarnReviewErrorProps = {
    payload: { error?: string; errorCode?: string; message?: string } | undefined;
    navigation: { pop: () => void };
    showPushTransactionFailedAlert: () => void;
    showPendingTransactionConflictAlert: () => void;
    showDeviceDisconnectedAlert: () => void;
};

export const handleEarnReviewError = ({
    payload,
    navigation,
    showPushTransactionFailedAlert,
    showPendingTransactionConflictAlert,
    showDeviceDisconnectedAlert,
}: HandleEarnReviewErrorProps) => {
    if (payload?.message === 'tx-cancelled') {
        return;
    }

    if (payload?.error === 'push-transaction-pending-conflict') {
        showPendingTransactionConflictAlert();

        return;
    }

    if (payload?.error === 'push-transaction-failed') {
        showPushTransactionFailedAlert();

        return;
    }

    const errorCode = payload?.errorCode;

    if (USER_CANCELLED_ERROR_CODES.some(code => code === errorCode)) {
        navigation.pop();

        return;
    }

    showDeviceDisconnectedAlert();
};
