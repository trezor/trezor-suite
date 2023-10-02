import { useState } from 'react';

import { checkDeviceAuthenticityThunk } from '@suite-common/device-authenticity';
import { Button } from '@trezor/components';
import { ERROR_CODES } from '@trezor/connect/lib/constants/errors';

import { onCancel, openModal } from 'src/actions/suite/modalActions';
import { DeviceAuthenticationExplainer, Modal, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

export const AuthenticateDeviceModal = () => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    const handleClick = async () => {
        setIsLoading(true);
        const result = await dispatch(
            checkDeviceAuthenticityThunk({
                allowDebugKeys: isDebugModeActive,
            }),
        );

        setIsLoading(false);
        if (result && result.payload !== ERROR_CODES.Method_Cancel) {
            dispatch(openModal({ type: 'authenticate-device-fail' }));
        }
    };
    const handleClose = () => dispatch(onCancel());

    return (
        <Modal
            isCancelable
            onCancel={handleClose}
            heading={<Translation id="TR_LETS_CHECK_YOUR_DEVICE" />}
            bottomBar={
                <Button onClick={handleClick} isDisabled={isLoading} isLoading={isLoading}>
                    <Translation id="TR_START_CHECK" />
                </Button>
            }
        >
            <DeviceAuthenticationExplainer />
        </Modal>
    );
};
