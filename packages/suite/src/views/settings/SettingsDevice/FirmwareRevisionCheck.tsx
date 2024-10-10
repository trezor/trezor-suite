import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { toggleCheckFirmwareAuthenticity } from 'src/actions/suite/suiteActions';
import { HELP_CENTER_FIRMWARE_REVISION_CHECK } from '@trezor/urls';

export const FirmwareRevisionCheck = () => {
    const dispatch = useDispatch();
    const isFirmwareAuthenticityCheckDisabled = useSelector(
        state =>
            // users can granularly turn off the partial checks in debug settings
            // in that case, the toggle shall be considered off, inviting the user to turn it on.
            state.suite.settings.isFirmwareRevisionCheckDisabled ||
            state.suite.settings.isFirmwareHashCheckDisabled,
    );

    const handleClick = () =>
        dispatch(
            isFirmwareAuthenticityCheckDisabled
                ? toggleCheckFirmwareAuthenticity({ isDisabled: false })
                : openModal({ type: 'firmware-revision-opt-out' }),
        );

    return (
        <SectionItem>
            <TextColumn
                title={
                    <Translation
                        id={
                            isFirmwareAuthenticityCheckDisabled
                                ? 'TR_DEVICE_FIRMWARE_REVISION_CHECK_TITLE_DISABLED'
                                : 'TR_DEVICE_FIRMWARE_REVISION_CHECK_TITLE'
                        }
                    />
                }
                description={
                    <Translation
                        id={
                            isFirmwareAuthenticityCheckDisabled
                                ? 'TR_DEVICE_FIRMWARE_REVISION_CHECK_DESCRIPTION_DISABLED'
                                : 'TR_DEVICE_FIRMWARE_REVISION_CHECK_DESCRIPTION'
                        }
                    />
                }
                buttonLink={HELP_CENTER_FIRMWARE_REVISION_CHECK}
            />
            <ActionColumn>
                <ActionButton
                    onClick={handleClick}
                    variant={isFirmwareAuthenticityCheckDisabled ? 'primary' : 'destructive'}
                    data-testid="@settings/device/open-firmware-revision-check-modal-button"
                >
                    <Translation
                        id={
                            isFirmwareAuthenticityCheckDisabled
                                ? 'TR_DEVICE_FIRMWARE_REVISION_CHECK_BUTTON_DISABLED'
                                : 'TR_DEVICE_FIRMWARE_REVISION_CHECK_BUTTON'
                        }
                    />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
