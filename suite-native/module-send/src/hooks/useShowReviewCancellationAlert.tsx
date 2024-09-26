import { useDispatch } from 'react-redux';

import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';
import { cancelSignSendFormTransactionThunk } from '@suite-common/wallet-core';

type AlertResolveValue = { wasReviewCanceled: boolean };

export const useShowReviewCancellationAlert = () => {
    const { showAlert } = useAlert();
    const dispatch = useDispatch();

    const showReviewCancellationAlert = () =>
        new Promise<AlertResolveValue>(resolve =>
            showAlert({
                title: <Translation id="moduleSend.review.cancelAlert.title" />,
                primaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                primaryButtonVariant: 'redBold',
                secondaryButtonVariant: 'redElevation0',
                secondaryButtonTitle: (
                    <Translation id="moduleSend.review.cancelAlert.continueButton" />
                ),
                onPressPrimaryButton: () => {
                    dispatch(cancelSignSendFormTransactionThunk());

                    return resolve({ wasReviewCanceled: true });
                },
                onPressSecondaryButton: () => resolve({ wasReviewCanceled: false }),
            }),
        );

    return showReviewCancellationAlert;
};
