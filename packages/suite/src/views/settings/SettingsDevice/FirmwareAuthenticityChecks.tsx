import { HELP_CENTER_FIRMWARE_REVISION_CHECK } from '@trezor/urls';

import { openModal } from 'src/actions/suite/modalActions';
import { toggleFirmwareAuthenticityChecks } from 'src/actions/suite/suiteActions';
import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    selectIsFirmwareHashCheckEnabled,
    selectIsFirmwareRevisionCheckEnabled,
} from 'src/reducers/suite/suiteReducer';

export const FirmwareAuthenticityChecks = () => {
    const dispatch = useDispatch();
    const isFirmwareHashCheckEnabled = useSelector(selectIsFirmwareHashCheckEnabled);
    const isFirmwareRevisionCheckEnabled = useSelector(selectIsFirmwareRevisionCheckEnabled);

    // Checks can gradually be turned off in debug settings.
    // In case either one of the check is turned off, the toggle shall be considered off, inviting the user to turn back it on.
    const areAllFirmwareChecksEnabled =
        isFirmwareHashCheckEnabled && isFirmwareRevisionCheckEnabled;

    const handleClick = () =>
        dispatch(
            areAllFirmwareChecksEnabled
                ? openModal({ type: 'firmware-authenticity-checks-opt-out' })
                : toggleFirmwareAuthenticityChecks(true),
        );

    return (
        <SectionItem>
            <TextColumn
                title={
                    <Translation
                        id={
                            areAllFirmwareChecksEnabled
                                ? 'TR_DEVICE_FIRMWARE_REVISION_CHECK_TITLE'
                                : 'TR_DEVICE_FIRMWARE_REVISION_CHECK_TITLE_DISABLED'
                        }
                    />
                }
                description={
                    <Translation
                        id={
                            areAllFirmwareChecksEnabled
                                ? 'TR_DEVICE_FIRMWARE_REVISION_CHECK_DESCRIPTION'
                                : 'TR_DEVICE_FIRMWARE_REVISION_CHECK_DESCRIPTION_DISABLED'
                        }
                    />
                }
                buttonLink={HELP_CENTER_FIRMWARE_REVISION_CHECK}
            />
            <ActionColumn>
                <ActionButton
                    onClick={handleClick}
                    variant={areAllFirmwareChecksEnabled ? 'destructive' : 'primary'}
                    data-testid="@settings/device/open-firmware-revision-check-modal-button"
                >
                    <Translation
                        id={
                            areAllFirmwareChecksEnabled
                                ? 'TR_DEVICE_FIRMWARE_REVISION_CHECK_BUTTON'
                                : 'TR_DEVICE_FIRMWARE_REVISION_CHECK_BUTTON_DISABLED'
                        }
                    />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
