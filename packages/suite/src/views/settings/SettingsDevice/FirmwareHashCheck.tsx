import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { checkFirmwareHash } from 'src/actions/suite/suiteActions';
import { HELP_CENTER_FIRMWARE_REVISION_CHECK } from '@trezor/urls';

export const FirmwareHashCheck = () => {
    const dispatch = useDispatch();
    const isFirmwareHashCheckDisabled = useSelector(
        state => state.suite.settings.isFirmwareHashCheckDisabled,
    );

    const handleClick = () =>
        dispatch(
            isFirmwareHashCheckDisabled
                ? checkFirmwareHash({ isDisabled: false })
                : openModal({ type: 'firmware-hash-opt-out' }),
        );

    return (
        <SectionItem>
            <TextColumn
                title={
                    <Translation
                        id={
                            isFirmwareHashCheckDisabled
                                ? 'TR_DEVICE_FIRMWARE_REVISION_CHECK_TITLE_DISABLED'
                                : 'TR_DEVICE_FIRMWARE_REVISION_CHECK_TITLE'
                        }
                    />
                }
                description={
                    <Translation
                        id={
                            isFirmwareHashCheckDisabled
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
                    variant={isFirmwareHashCheckDisabled ? 'primary' : 'destructive'}
                    data-testid="@settings/device/open-firmware-hash-check-modal-button"
                >
                    <Translation
                        id={
                            isFirmwareHashCheckDisabled
                                ? 'TR_DEVICE_FIRMWARE_REVISION_CHECK_BUTTON_DISABLED'
                                : 'TR_DEVICE_FIRMWARE_REVISION_CHECK_BUTTON'
                        }
                    />
                    {/* TODO #14766 REMOVE ME ! */}
                    (HASH)
                </ActionButton>
            </ActionColumn>
        </SectionItem>
    );
};
