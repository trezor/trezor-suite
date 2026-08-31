import { useDispatch } from 'react-redux';

import { LearnMoreButton } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { selectIsDeviceAuthenticityCheckEnabled } from '@suite/settings';
import { Column } from '@trezor/components';
import {
    ActionButton,
    ActionColumn,
    SectionItem,
    SettingsRequirementBanner,
    TextColumn,
} from '@trezor/product-components';
import { HELP_CENTER_DEVICE_AUTHENTICATION } from '@trezor/urls';

import { toggleDeviceAuthenticityCheck } from 'src/actions/suite/suiteActions';
import { useSelector } from 'src/hooks/suite';

type DeviceAuthenticityOptOutProps = {
    isDeviceAuthenticityCheckSupported: boolean;
};

export const DeviceAuthenticityOptOut = ({
    isDeviceAuthenticityCheckSupported,
}: DeviceAuthenticityOptOutProps) => {
    const dispatch = useDispatch();
    const isDeviceAuthenticityCheckEnabled = useSelector(selectIsDeviceAuthenticityCheckEnabled);

    const handleClick = () => {
        if (!isDeviceAuthenticityCheckSupported) return;

        if (isDeviceAuthenticityCheckEnabled) {
            dispatch(openModal({ type: 'device-authenticity-check-opt-out' }));

            return;
        }

        dispatch(toggleDeviceAuthenticityCheck(true));
    };

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
                bottomContent={
                    <Column gap={8} alignItems="flex-start">
                        {!isDeviceAuthenticityCheckSupported && (
                            <SettingsRequirementBanner>
                                <Translation id="TR_NOT_SUPPORTED_ON_THIS_DEVICE" />
                            </SettingsRequirementBanner>
                        )}
                        <LearnMoreButton url={HELP_CENTER_DEVICE_AUTHENTICATION} />
                    </Column>
                }
            />
            <ActionColumn>
                <ActionButton
                    onClick={handleClick}
                    intent={isDeviceAuthenticityCheckEnabled ? 'critical' : 'brand'}
                    isDisabled={!isDeviceAuthenticityCheckSupported}
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
