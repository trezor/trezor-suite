import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { Column } from '@trezor/components';
import {
    ModalBackdrop,
    type ModalBackdropProps,
} from '@trezor/components/src/components/Modal/ModalBackdrop';

import { useSelector } from 'src/hooks/suite';

import { ConnectAppBar } from './ConnectAppBar';

interface ConnectModalBackdropProps extends ModalBackdropProps {
    canSwitchDevice?: boolean;
}

export const ConnectModalBackdrop = ({
    children,
    canSwitchDevice,
    ...rest
}: ConnectModalBackdropProps) => {
    const connectPopupCall = useSelector(selectConnectPopupCall);

    if (!connectPopupCall || connectPopupCall.state === 'finished') {
        // Not in a connect popup call, fallback to default ModalBackdrop
        return <ModalBackdrop {...rest}>{children}</ModalBackdrop>;
    }

    return (
        <ModalBackdrop
            {...rest}
            onClick={() => {}}
            opaque
            padding={{ top: 64, bottom: 8, horizontal: 8 }}
        >
            <ConnectAppBar canSwitchDevice={canSwitchDevice} />
            {/* Positioned so it paints above the absolutely positioned ConnectAppBar, whose
                banners would otherwise overlay the modal content. */}
            <Column position={{ type: 'relative' }} width="100%" alignItems="center" gap={16}>
                {children}
            </Column>
        </ModalBackdrop>
    );
};
