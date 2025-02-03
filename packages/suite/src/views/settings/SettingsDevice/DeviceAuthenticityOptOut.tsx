import { HELP_CENTER_DEVICE_AUTHENTICATION } from '@trezor/urls';

import { openModal } from 'src/actions/suite/modalActions';
import { toggleDeviceAuthenticityCheck } from 'src/actions/suite/suiteActions';
import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectIsDeviceAuthenticityCheckEnabled } from 'src/reducers/suite/suiteReducer';

export const DeviceAuthenticityOptOut = () => {
    const dispatch = useDispatch();
    const isDeviceAuthenticityCheckEnabled = useSelector(selectIsDeviceAuthenticityCheckEnabled);

    const handleClick = () =>
        dispatch(
            isDeviceAuthenticityCheckEnabled
                ? openModal({ type: 'device-authenticity-check-opt-out' })
                : toggleDeviceAuthenticityCheck(false),
        );

    return (
        <SectionItem>
            <TextColumn
                title={
                    <Translation
                        id={
                            isDeviceAuthenticityCheckEnabled
                                ? 'TR_DEVICE_AUTHENTICITY_OPT_OUT_TITLE'
                                : 'TR_DEVICE_AUTHENTICITY_OPT_OUT_TITLE_DISABLED'
                        }
                    />
                }
                description={
                    <Translation
                        id={
                            isDeviceAuthenticityCheckEnabled
                                ? 'TR_DEVICE_AUTHENTICITY_OPT_OUT_DESCRIPTION'
                                : 'TR_DEVICE_AUTHENTICITY_OPT_OUT_DESCRIPTION_DISABLED'
                        }
                    />
                }
                buttonLink={HELP_CENTER_DEVICE_AUTHENTICATION}
            />
            <ActionColumn>
                <ActionButton
                    onClick={handleClick}
                    variant={isDeviceAuthenticityCheckEnabled ? 'destructive' : 'primary'}
                    data-testid="@settings/device/open-device-authenticity-check-opt-out-modal-button"
                >
                    <Translation
                        id={
                            isDeviceAuthenticityCheckEnabled
                                ? 'TR_DEVICE_AUTHENTICITY_OPT_OUT_BUTTON'
                                : 'TR_DEVICE_AUTHENTICITY_OPT_OUT_BUTTON_DISABLED'
                        }
                    />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
