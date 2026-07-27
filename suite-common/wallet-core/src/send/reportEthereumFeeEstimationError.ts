import { captureException, withScope } from '@sentry/core';

import { type Account, type FormState } from '@suite-common/wallet-types';
import { isEvmApprovalTx } from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/connect';
import { type SerializedError } from '@trezor/connect-common/src/constants/errors';

interface ReportEthereumFeeEstimationFailedParams {
    account: Account;
    formState: FormState;
    tokenInfo: TokenInfo | undefined;
    estimateTarget: string;
    error: SerializedError;
}

const reportedSignatures = new Set<string>();

/**
 * Reports an error when Ethereum fee estimation fails.
 */
export const reportEthereumFeeEstimationFailed = ({
    account,
    formState,
    tokenInfo,
    estimateTarget,
    error,
}: ReportEthereumFeeEstimationFailedParams): void => {
    const isApproveTx = isEvmApprovalTx(formState.transactionData);
    const isTokenTransfer = !!tokenInfo;
    const isDexFlow = !!formState.ethereumAdjustGasLimit;
    const toIsSelf = estimateTarget === account.descriptor;
    const connectErrorCode = error.code ?? 'unknown';

    const signature = [
        account.symbol,
        isTokenTransfer,
        isApproveTx,
        isDexFlow,
        toIsSelf,
        connectErrorCode,
    ].join('|');
    if (reportedSignatures.has(signature)) {
        return;
    }
    reportedSignatures.add(signature);

    withScope(scope => {
        scope.setTag('error.code', 'eth_fee_estimation_failed');
        scope.setTag('fee.network', account.symbol);
        scope.setTag('fee.accountType', account.accountType);
        scope.setTag('fee.isApproveTx', isApproveTx);
        scope.setTag('fee.isTokenTransfer', isTokenTransfer);
        scope.setTag('fee.isDexFlow', isDexFlow);
        scope.setTag('fee.toIsSelf', toIsSelf);
        scope.setTag('fee.hasTransactionData', !!formState.transactionData);
        scope.setTag('fee.selectedFee', formState.selectedFee ?? 'unknown');
        scope.setTag('fee.connectErrorCode', connectErrorCode);
        scope.setExtra('connectErrorMessage', error.message);
        captureException(
            new Error(
                `Ethereum fee estimation failed, using backup gas limit [${connectErrorCode}]`,
            ),
        );
    });
};
