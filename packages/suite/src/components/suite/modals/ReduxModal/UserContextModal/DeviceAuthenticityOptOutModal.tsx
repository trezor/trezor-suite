import { Column, Paragraph } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { deviceAuthenticityOptOut } from 'src/actions/suite/suiteActions';
import { useDispatch } from 'src/hooks/suite';
import { OptOutModal } from './OptOutModal';

type DeviceAuthenticityOptOutModalProps = {
    onCancel: () => void;
};

export const DeviceAuthenticityOptOutModal = ({ onCancel }: DeviceAuthenticityOptOutModalProps) => {
    const dispatch = useDispatch();

    return (
        <OptOutModal
            headingKey="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_HEADING"
            checkboxLabelKey="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_CHECKBOX_TITLE"
            confirmKey="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_BUTTON"
            data-testid="@device-authenticity"
            onChange={({ isDisabled }) => dispatch(deviceAuthenticityOptOut(isDisabled))}
            onCancel={onCancel}
        >
            <Column gap={16}>
                <Paragraph>
                    <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_1" />
                </Paragraph>
                <Paragraph>
                    <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_2" />
                </Paragraph>
                <Paragraph>
                    <Translation id="TR_DEVICE_AUTHENTICITY_OPT_OUT_MODAL_DESCRIPTION_3" />
                </Paragraph>
            </Column>
        </OptOutModal>
    );
};
