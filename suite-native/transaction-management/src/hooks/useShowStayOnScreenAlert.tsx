import { useCallback } from 'react';

import { type Alert, useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';

export type StayOnScreenAlertOptions = Partial<
    Omit<Alert, 'onPressPrimaryButton' | 'onPressSecondaryButton'>
>;

type ShowStayOnScreenAlertProps = {
    onRemoveConfirmed: () => void;
    onStayConfirmed?: () => void;
    alertOptions?: StayOnScreenAlertOptions;
};

export const useShowStayOnScreenAlert = () => {
    const { showAlert, hideAlert } = useAlert();

    const showStayOnScreenAlert = useCallback(
        ({ onRemoveConfirmed, onStayConfirmed, alertOptions }: ShowStayOnScreenAlertProps) => {
            const {
                title = <Translation id="transactionManagement.stayOnScreenAlert.title" />,
                primaryButtonTitle = (
                    <Translation id="transactionManagement.stayOnScreenAlert.removeButton" />
                ),
                primaryButtonColorProps = {
                    intent: 'warning',
                    priority: 'primary',
                },
                secondaryButtonTitle = (
                    <Translation id="transactionManagement.stayOnScreenAlert.stayButton" />
                ),
                secondaryButtonColorProps = {
                    intent: 'warning',
                    priority: 'secondary',
                },
                ...restAlertOptions
            } = alertOptions ?? {};
            showAlert({
                ...restAlertOptions,
                title,
                primaryButtonTitle,
                primaryButtonColorProps,
                secondaryButtonTitle,
                secondaryButtonColorProps,
                onPressPrimaryButton: onRemoveConfirmed,
                onPressSecondaryButton: onStayConfirmed,
            });
        },
        [showAlert],
    );

    return {
        showStayOnScreenAlert,
        hideStayOnScreenAlert: hideAlert,
    };
};
