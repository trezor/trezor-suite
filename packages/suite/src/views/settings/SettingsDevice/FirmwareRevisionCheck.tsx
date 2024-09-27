import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { checkFirmwareRevision } from 'src/actions/suite/suiteActions';
import { HELP_CENTER_FIRMWARE_REVISION_CHECK } from '@trezor/urls';
export const FirmwareRevisionCheck = () => {
    const dispatch = useDispatch();
    const isFirmwareRevisionCheckDisabled = useSelector(
        state => state.suite.settings.isFirmwareRevisionCheckDisabled,
    );

    const handleClick = () =>
        dispatch(
            isFirmwareRevisionCheckDisabled
                ? checkFirmwareRevision({ isDisabled: false })
                : openModal({ type: 'firmware-revision-opt-out' }),
        );

    return (
        <SectionItem>
            <TextColumn
                title={
                    <Translation
                        id={
                            isFirmwareRevisionCheckDisabled
                                ? 'TR_DEVICE_FIRMWARE_REVISION_CHECK_TITLE_DISABLED'
                                : 'TR_DEVICE_FIRMWARE_REVISION_CHECK_TITLE'
                        }
                    />
                }
                description={
                    <Translation
                        id={
                            isFirmwareRevisionCheckDisabled
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
                    variant={isFirmwareRevisionCheckDisabled ? 'primary' : 'destructive'}
                    data-testid="@settings/device/open-firmware-revision-check-modal-button"
                >
                    <Translation
                        id={
                            isFirmwareRevisionCheckDisabled
                                ? 'TR_DEVICE_FIRMWARE_REVISION_CHECK_BUTTON_DISABLED'
                                : 'TR_DEVICE_FIRMWARE_REVISION_CHECK_BUTTON'
                        }
                    />
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
