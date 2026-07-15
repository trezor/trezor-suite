import { type Alert } from './alertsAtoms';
import { useAlert } from './useAlert';

type AlertResult = { action: 'primaryButton' | 'secondaryButton' };

export const useShowAlertResult = () => {
    const { showAlert } = useAlert();

    const showAlertResult = ({
        onPressPrimaryButton,
        onPressSecondaryButton,
        ...alert
    }: Alert): Promise<AlertResult> =>
        new Promise(resolve =>
            showAlert({
                ...alert,
                onPressPrimaryButton: () => {
                    void Promise.resolve(onPressPrimaryButton?.()).then(_ =>
                        resolve({ action: 'primaryButton' }),
                    );
                },
                onPressSecondaryButton: () => {
                    void Promise.resolve(onPressSecondaryButton?.()).then(_ =>
                        resolve({ action: 'secondaryButton' }),
                    );
                },
            }),
        );

    return { showAlertResult };
};
