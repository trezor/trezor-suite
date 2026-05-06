import { useIntl } from 'react-intl';

import { type TranslationKey, messages } from '@suite/intl';
import { type TrezorDevice } from '@suite-common/suite-types';
import TrezorConnect from '@trezor/connect';

import { ConfirmActionModalView } from './ConfirmActionModalView';

interface ConfirmActionProps {
    cancelable?: boolean;
    device: TrezorDevice;
    title?: TranslationKey;
    onCancel?: () => void;
    enableBackdropClick?: boolean;
}

export const ConfirmActionModal = ({
    title,
    device,
    onCancel,
    cancelable = true,
    enableBackdropClick = true,
}: ConfirmActionProps) => {
    const intl = useIntl();
    const handleCancel = () => {
        if (!cancelable) {
            return;
        }
        TrezorConnect.cancel({ reason: intl.formatMessage(messages.TR_CANCELLED) });
        onCancel?.();
    };

    return (
        <ConfirmActionModalView
            title={title}
            device={device}
            onCancel={handleCancel}
            onBackdropDismiss={onCancel}
            cancelable={cancelable}
            enableBackdropClick={enableBackdropClick}
        />
    );
};
