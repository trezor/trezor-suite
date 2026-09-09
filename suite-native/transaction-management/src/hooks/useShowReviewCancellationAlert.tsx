import { useCallback } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';
import { cancelSignSendFormTransactionThunk } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';

type AlertResolveValue = { wasReviewCanceled: boolean };

export const useShowReviewCancellationAlert = () => {
    const { showAlert } = useAlert();
    const { dispatch } = useServices(selectDispatch);

    return useCallback(
        () =>
            new Promise<AlertResolveValue>(resolve =>
                showAlert({
                    title: <Translation id="transactionManagement.review.cancelAlert.title" />,
                    primaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                    primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                    secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
                    secondaryButtonTitle: (
                        <Translation id="transactionManagement.review.cancelAlert.continueButton" />
                    ),
                    onPressPrimaryButton: () => {
                        dispatch(cancelSignSendFormTransactionThunk());

                        return resolve({ wasReviewCanceled: true });
                    },
                    onPressSecondaryButton: () => resolve({ wasReviewCanceled: false }),
                }),
            ),
        [dispatch, showAlert],
    );
};
