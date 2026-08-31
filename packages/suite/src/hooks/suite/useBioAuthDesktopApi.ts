import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useTranslation } from '@suite/intl';
import { isMacOs } from '@trezor/env-utils';

import {
    requestBioAuthChangeThunk,
    requestBioAuthValidationThunk,
} from 'src/actions/suite/bioAuthThunks';

import { useSelector } from './useSelector';

export const useBioAuthDesktopApi = () => {
    const { isBioAuthAvailable, isBioAuthEnabled, isBioAuthValidationRequired, cancelled } =
        useSelector(state => ({
            isBioAuthAvailable: state.bioAuth.bioAuthAvailable,
            isBioAuthEnabled: state.bioAuth.bioAuthEnabled,
            isBioAuthValidationRequired: state.bioAuth.bioAuthValidationRequired,
            cancelled: state.bioAuth.cancelled,
        }));

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
