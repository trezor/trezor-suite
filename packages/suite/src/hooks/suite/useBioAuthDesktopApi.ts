import { useCallback, useState } from 'react';

import { useTranslation } from '@suite/intl';
import { useDispatch } from '@suite-common/redux-utils';
import { isMacOs } from '@trezor/env-utils';

import {
    requestBioAuthChangeThunk,
    requestBioAuthValidationThunk,
} from 'src/actions/suite/bioAuthThunks';
import { useSelector } from 'src/hooks/suite';
import { selectBioAuth } from 'src/reducers/bioAuth';

export const useBioAuthDesktopApi = () => {
    const {
        bioAuthAvailable: isBioAuthAvailable,
        bioAuthEnabled: isBioAuthEnabled,
        bioAuthValidationRequired: isBioAuthValidationRequired,
        cancelled,
    } = useSelector(selectBioAuth);

    const { translationString } = useTranslation();
    const dispatch = useDispatch();
    const messageSuccess = translationString(
        isMacOs() ? 'TR_BIO_AUTH_SYSTEM_MESSAGE_MAC' : 'TR_BIO_AUTH_SYSTEM_MESSAGE_WIN',
    );
    const messageError = translationString('TR_BIO_AUTH_FAILED');
    const [isCallInProgress, setIsCallInProgress] = useState(false);
    const [optimisticUpdateIsBioAuthEnabled, setOptimisticUpdateIsBioAuthEnabled] = useState<
        boolean | null
    >(null);

    const requestBioAuthChange = useCallback(async () => {
        if (isCallInProgress) return;
        setIsCallInProgress(true);
        const nextValue = !isBioAuthEnabled;
        setOptimisticUpdateIsBioAuthEnabled(nextValue);
        await dispatch(
            requestBioAuthChangeThunk({
                payload: nextValue,
                messageSuccess,
                messageError,
            }),
        );
        setIsCallInProgress(false);
        setOptimisticUpdateIsBioAuthEnabled(null);
    }, [
        dispatch,
        isBioAuthEnabled,
        setIsCallInProgress,
        messageSuccess,
        messageError,
        isCallInProgress,
    ]);

    const requestBioAuthValidation = useCallback(async () => {
        setIsCallInProgress(true);
        await dispatch(requestBioAuthValidationThunk({ messageSuccess, messageError }));
        setIsCallInProgress(false);
    }, [dispatch, messageSuccess, messageError]);

    return {
        isBioAuthEnabled,
        isBioAuthAvailable,
        isBioAuthValidationRequired,
        requestBioAuthChange,
        requestBioAuthValidation,
        isCallInProgress,
        optimisticUpdateIsBioAuthEnabled,
        cancelled,
    };
};
