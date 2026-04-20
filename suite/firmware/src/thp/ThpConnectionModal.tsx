import { type TrezorDevice } from '@suite-common/suite-types';

import { ConfirmActionModal } from './ConfirmActionModal';

type ThpConnectionModalProps = {
    device: TrezorDevice;
};

export const ThpConnectionModal = ({ device }: ThpConnectionModalProps) => (
    <ConfirmActionModal
        device={device}
        title="TR_THP_SECURELY_CONNECT_WITH_TREZOR"
        enableBackdropClick={false}
    />
);
