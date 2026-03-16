import { useSelector } from 'react-redux';

import { selectConnectPopupCall } from '@suite-common/connect-popup';
import {
    ModalBackdrop,
    type ModalBackdropProps,
} from '@trezor/components/src/components/Modal/ModalBackdrop';
import { spacings } from '@trezor/theme';

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
            padding={{ top: spacings.xxxxxl, bottom: spacings.xs, horizontal: spacings.xs }}
        >
            <ConnectAppBar canSwitchDevice={canSwitchDevice} />
            {children}
        </ModalBackdrop>
    );
};
