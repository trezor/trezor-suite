import { useCallback } from 'react';

import { type Alert, useAlert } from '@suite-native/alerts';
import { Translation, type TxKeyPath } from '@suite-native/intl';

type ShowYieldAlertParams = {
    title: TxKeyPath;
    description: TxKeyPath;
    primaryButtonTitle?: TxKeyPath;
    onPressPrimaryButton?: Alert['onPressPrimaryButton'];
};

export const useShowYieldAlert = () => {
    const { showAlert } = useAlert();

    return useCallback(
        ({
            title,
            description,
            primaryButtonTitle = 'generic.buttons.close',
            onPressPrimaryButton,
        }: ShowYieldAlertParams) =>
            showAlert({
                title: <Translation id={title} />,
                description: <Translation id={description} />,
                primaryButtonTitle: <Translation id={primaryButtonTitle} />,
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                onPressPrimaryButton,
            }),
        [showAlert],
    );
};
