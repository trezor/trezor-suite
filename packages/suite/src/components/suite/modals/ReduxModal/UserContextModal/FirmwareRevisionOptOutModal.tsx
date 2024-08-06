import { Column, Paragraph } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { checkFirmwareRevision } from 'src/actions/suite/suiteActions';
import { useDispatch } from 'src/hooks/suite';
import { OptOutModal } from './OptOutModal';

type DeviceAuthenticityOptOutModalProps = {
    onCancel: () => void;
};

export const FirmwareRevisionOptOutModal = ({ onCancel }: DeviceAuthenticityOptOutModalProps) => {
    const dispatch = useDispatch();

    return (
        <OptOutModal
            onCancel={onCancel}
            headingKey="TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_HEADING"
            checkboxLabelKey="TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_CHECKBOX_TITLE"
            confirmKey="TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_BUTTON"
            data-test="@device-firmware-revision"
            onChange={({ isDisabled }) => dispatch(checkFirmwareRevision({ isDisabled }))}
        >
            <Column gap={16}>
                <Paragraph>
                    <Translation id="TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_DESCRIPTION_1" />
                </Paragraph>
                <Paragraph>
                    <Translation id="TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_DESCRIPTION_2" />
                </Paragraph>
                <Paragraph>
                    <Translation id="TR_DEVICE_FIRMWARE_REVISION_CHECK_MODAL_DESCRIPTION_3" />
                </Paragraph>
            </Column>
        </OptOutModal>
    );
};
