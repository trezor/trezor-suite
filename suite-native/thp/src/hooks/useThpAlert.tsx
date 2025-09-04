import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { startThpAutoconnectThunk, thpActions } from '@suite-common/thp';
import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';

export const useThpAlerts = () => {
    const dispatch = useDispatch();
    const { showAlert } = useAlert();

    const turnOnAutoconnect = useCallback(() => {
        dispatch(startThpAutoconnectThunk());
    }, [dispatch]);

    const ignoreAutoconnect = useCallback(() => {
        dispatch(thpActions.finishThpFlow());
    }, [dispatch]);

    const showThpAutoconnectAlert = useCallback(() => {
        showAlert({
            title: <Translation id="thp.autoconnect.title" />,
            description: <Translation id="thp.autoconnect.description" />,
            primaryButtonTitle: <Translation id="thp.autoconnect.turnOnButton" />,
            onPressPrimaryButton: turnOnAutoconnect,
            secondaryButtonTitle: <Translation id="thp.autoconnect.noThanksButton" />,
            onPressSecondaryButton: ignoreAutoconnect,
        });
    }, [showAlert, turnOnAutoconnect, ignoreAutoconnect]);

    return { showThpAutoconnectAlert };
};
