import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { selectIsDeviceAuthenticityCheckEnabled } from '@suite/settings';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { HELP_CENTER_DEVICE_AUTHENTICATION } from '@trezor/urls';

import { toggleDeviceAuthenticityCheck } from 'src/actions/suite/suiteActions';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const DeviceAuthenticityOptOut = () => {
    const dispatch = useDispatch();
    const isDeviceAuthenticityCheckEnabled = useSelector(selectIsDeviceAuthenticityCheckEnabled);

    const handleClick = () =>
        dispatch(
            isDeviceAuthenticityCheckEnabled
                ? openModal({ type: 'device-authenticity-check-opt-out' })
                : toggleDeviceAuthenticityCheck(true),
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
                bottomContent={<LearnMoreButton url={HELP_CENTER_DEVICE_AUTHENTICATION} />}
            />
            <ActionColumn>
                <ActionButton
                    onClick={handleClick}
                    intent={isDeviceAuthenticityCheckEnabled ? 'critical' : 'brand'}
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
