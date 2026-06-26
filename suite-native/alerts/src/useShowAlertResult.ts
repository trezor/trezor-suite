import { type Result, err, ok } from '@trezor/type-utils';

import { type Alert } from './alertsAtoms';
import { useAlert } from './useAlert';

type AlertResult = Result<void, { type: 'cancelled' }>;

type ShowAlertResultParams = Omit<Alert, 'onPressPrimaryButton' | 'onPressSecondaryButton'> & {
    onPressPrimaryButton?: () => AlertResult | Promise<AlertResult> | void;
    onPressSecondaryButton?: () => AlertResult | Promise<AlertResult> | void;
};

export const useShowAlertResult = () => {
    const { showAlert } = useAlert();

    const showAlertResult = ({
        onPressPrimaryButton,
        onPressSecondaryButton,
        ...alert
    }: ShowAlertResultParams): Promise<AlertResult> =>
        new Promise(resolve =>
            showAlert({
                ...alert,
                onPressPrimaryButton: () => {
                    void Promise.resolve(onPressPrimaryButton?.()).then(result =>
                        resolve(result ?? ok()),
                    );
                },
                onPressSecondaryButton: () => {
                    void Promise.resolve(onPressSecondaryButton?.()).then(result =>
                        resolve(result ?? err({ type: 'cancelled' })),
                    );
                },
            }),
        );

    return { showAlertResult };
};
