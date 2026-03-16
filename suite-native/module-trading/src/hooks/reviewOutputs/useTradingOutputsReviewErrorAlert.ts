import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import type { DeviceRootState } from '@suite-common/device';
import { type AccountsRootState, selectAccountNetworkType } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

export const useTradingOutputsReviewErrorAlert = (accountKey: AccountKey) => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    const accountNetworkType = useSelector((state: AccountsRootState & DeviceRootState) =>
        selectAccountNetworkType(state, accountKey),
    );

    const isSolanaAccount = accountNetworkType === 'solana';

    return useCallback(
        (onRetry: () => void, onCancel: () => void) => {
            showAlert({
                icon: 'warningCircle',
                title: isSolanaAccount
                    ? translate('moduleSend.review.outputs.errorAlert.solana.title')
                    : translate('moduleSend.review.outputs.errorAlert.generic.title'),
                description: isSolanaAccount
                    ? translate('moduleSend.review.outputs.errorAlert.solana.description')
                    : translate('moduleSend.review.outputs.errorAlert.generic.description'),
                primaryButtonTitle: translate('generic.buttons.tryAgain'),
                primaryButtonVariant: 'redBold',
                onPressPrimaryButton: onRetry,
                secondaryButtonTitle: translate('generic.buttons.cancel'),
                secondaryButtonVariant: 'redElevation0',
                onPressSecondaryButton: onCancel,
            });
        },
        [isSolanaAccount, showAlert, translate],
    );
};
