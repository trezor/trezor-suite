import { useState } from 'react';
// useDispatch used directly from react-redux instead of src/hooks/suite because we need unwrap() method
import { useDispatch } from 'react-redux';

import { checkDeviceAuthenticityThunk } from '@suite-common/device-authenticity';
import { Button } from '@trezor/components';

import { onCancel, openModal } from 'src/actions/suite/modalActions';
import { DeviceAuthenticationExplainer, Modal, Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectIsDebugModeActive } from 'src/reducers/suite/suiteReducer';

export const AuthenticateDeviceModal = () => {
    const [isLoading, setIsLoading] = useState(false);
    const dispatch = useDispatch();
    const isDebugModeActive = useSelector(selectIsDebugModeActive);

    const handleClick = async () => {
        setIsLoading(true);

        try {
            const result = await dispatch(
                checkDeviceAuthenticityThunk({
                    allowDebugKeys: isDebugModeActive,
                }),
            ).unwrap();

            setIsLoading(false);

            if (
                typeof result !== 'string' &&
                result.valid === false &&
                (result.error !== 'CA_PUBKEY_NOT_FOUND' || !result.configExpired)
            ) {
                dispatch(openModal({ type: 'authenticate-device-fail' }));
            }
        } catch (error) {
            console.warn(error);
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
