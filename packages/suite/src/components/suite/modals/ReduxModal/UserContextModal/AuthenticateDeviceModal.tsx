import { useState } from 'react';

import { checkDeviceAuthenticityThunk } from '@suite-common/device-authenticity';
import { Button } from '@trezor/components';

import { onCancel, openModal } from 'src/actions/suite/modalActions';
import { DeviceAuthenticationExplainer, Modal, Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';
import { selectDeviceAuthenticity } from '@suite-common/wallet-core';

export const AuthenticateDeviceModal = () => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const deviceAuthenticity = useSelector(selectDeviceAuthenticity);

    const handleClick = async () => {
        setIsLoading(true);

        await dispatch(checkDeviceAuthenticityThunk({ allowDebugKeys: isDebugModeActive }));

        setIsLoading(false);

        if (deviceAuthenticity?.valid === false) {
            dispatch(openModal({ type: 'authenticate-device-fail' }));
        }
    };

    const handleClose = () => dispatch(onCancel());

    return (
        <Modal
            isCancelable
            onCancel={handleClose}
            heading={<Translation id="TR_LETS_CHECK_YOUR_DEVICE" />}
            bottomBarComponents={
                <Button onClick={handleClick} isDisabled={isLoading} isLoading={isLoading}>
                    <Translation id="TR_START_CHECK" />
                </Button>
            }
        >
            <DeviceAuthenticationExplainer />
        </Modal>
    );
};
