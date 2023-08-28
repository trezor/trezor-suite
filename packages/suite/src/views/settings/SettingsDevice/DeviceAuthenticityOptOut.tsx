import { HELP_CENTER_DEVICE_AUTHENTICATION } from '@trezor/urls';

import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { deviceAutenticityOptOut } from 'src/actions/suite/suiteActions';

export const DeviceAuthenticityOptOut = () => {
    const dispatch = useDispatch();
    const isDeviceAuthenticityCheckDisabled = useSelector(
        state => state.suite.settings.isDeviceAuthenticityCheckDisabled,
    );

    const handleClick = () =>
        dispatch(
            isDeviceAuthenticityCheckDisabled
                ? deviceAutenticityOptOut(false)
                : openModal({ type: 'device-authenticity-opt-out' }),
        );

    return (
        <SectionItem data-test="@settings/device/device-authenticity-opt-out">
            <TextColumn
                title={
                    <Translation
                        id={
                            isDeviceAuthenticityCheckDisabled
                                ? 'TR_DEVICE_AUTHENTICITY_OPT_OUT_TITLE_DISABLED'
                                : 'TR_DEVICE_AUTHENTICITY_OPT_OUT_TITLE'
                        }
                    />
                }
                description={
                    <Translation
                        id={
                            isDeviceAuthenticityCheckDisabled
                                ? 'TR_DEVICE_AUTHENTICITY_OPT_OUT_DESCRIPTION_DISABLED'
                                : 'TR_DEVICE_AUTHENTICITY_OPT_OUT_DESCRIPTION'
                        }
                    />
                }
                buttonLink={HELP_CENTER_DEVICE_AUTHENTICATION}
            />
            <ActionColumn>
                <ActionButton
                    onClick={handleClick}
                    variant={isDeviceAuthenticityCheckDisabled ? 'primary' : 'destructive'}
                    data-test="@settings/device/open-device-authenticity-opt-out-modal-button"
                >
                    <Translation
                        id={
                            isDeviceAuthenticityCheckDisabled
                                ? 'TR_DEVICE_AUTHENTICITY_OPT_OUT_BUTTON_DISABLED'
                                : 'TR_DEVICE_AUTHENTICITY_OPT_OUT_BUTTON'
                        }
                    />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
