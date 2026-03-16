import { useState } from 'react';

import { checkDeviceAuthenticityThunk } from '@suite-common/device-authenticity';
import { type StoredAuthenticateDeviceResult } from '@suite-common/suite-types';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';

import { AuthenticateDeviceFailStep } from './AuthenticateDeviceFailStep';
import { AuthenticateDeviceInititalStep } from './AuthenticateDeviceInititalStep';

type AuthenticateDeviceModalProps = {
    handleClose: () => void;
};

export const AuthenticateDeviceModal = ({ handleClose }: AuthenticateDeviceModalProps) => {
    // Intentionally using only local state: the checkDeviceAuthenticityThunk always sets the global state, but if we
    // relied on it, user wouldn't be able to retry the check (would be DeviceCompromised right when you open the modal)
    const [result, setResult] = useState<StoredAuthenticateDeviceResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const isCheckFailed = result?.valid === false;

    const handleClick = async () => {
        setIsLoading(true);
        const result = await dispatch(
            checkDeviceAuthenticityThunk({ allowDebugKeys: isDebugModeActive }),
        );
        if (result.payload?.valid === true) {
            return handleClose();
        }
        setResult(result.payload);
        setIsLoading(false);
    };

    return isCheckFailed ? (
        <AuthenticateDeviceFailStep handleClose={handleClose} />
    ) : (
        <AuthenticateDeviceInititalStep
            handleClose={handleClose}
            handleClick={handleClick}
            isLoading={isLoading}
        />
    );
};
