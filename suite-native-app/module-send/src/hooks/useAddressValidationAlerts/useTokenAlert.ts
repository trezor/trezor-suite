import { useCallback, useState } from 'react';

import { G } from '@mobily/ts-belt';
import { type RouteProp, useRoute } from '@react-navigation/native';

import { useAlert } from '@suite-native/alerts';
import { type SendStackParamList, type SendStackRoutes } from '@suite-native/navigation';

import { createTokenAlert } from './alertBuilders';

export const useTokenAlert = () => {
    const {
        params: { tokenContract, accountKey },
    } = useRoute<RouteProp<SendStackParamList, SendStackRoutes.SendOutputs>>();
    const { showAlert } = useAlert();

    const [wasTokenAlertDisplayed, setWasTokenAlertDisplayed] = useState(
        G.isNullable(tokenContract),
    );

    const resetTokenAlert = useCallback(() => setWasTokenAlertDisplayed(false), []);

    const handleTokenAlert = useCallback(() => {
        if (!tokenContract) return;

        showAlert(
            createTokenAlert(accountKey, tokenContract, () => setWasTokenAlertDisplayed(true)),
        );
    }, [accountKey, tokenContract, showAlert, setWasTokenAlertDisplayed]);

    return {
        handleTokenAlert,
        wasTokenAlertDisplayed,
        resetTokenAlert,
    };
};
