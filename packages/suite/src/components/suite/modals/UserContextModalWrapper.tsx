import { selectSelectedDevice } from '@suite-common/device';

import { useSelector } from 'src/hooks/suite';

import { type Subprocess } from './ConnectSubprocessModal';
import { ConfirmActionModal } from './ReduxModal/DeviceContextModal/ConfirmActionModal';
import { PassphraseOnDeviceModal } from './ReduxModal/DeviceContextModal/PassphraseOnDeviceModal';
import { PinModal } from './ReduxModal/DeviceContextModal/PinModal';

type UserContextModalWrapperProps = {
    subprocess: Subprocess;
};

/**
 * Renders the same modal that the global modal stack
 * (`DeviceContextModal`) would render for the equivalent UI_EVENT — driven
 * by a connect-flow subprocess directly, with no Redux modal state
 * involvement. Used by local flows (`useConnectRun.startManual`) that want
 * to render the global modal components themselves instead of (or in
 * addition to) dispatching to the global modal slice.
 *
 * Switch mirrors `DeviceContextModal` for the events covered here. Add
 * cases as needed when wiring new flows.
 */
export const UserContextModalWrapper = ({ subprocess }: UserContextModalWrapperProps) => {
    const device = useSelector(selectSelectedDevice);
    if (!device) return null;

    switch (subprocess.type) {
        case 'ui-request_pin':
            return <PinModal device={device} />;
        case 'ui-button':
            return <ConfirmActionModal device={device} onCancel={subprocess.cancel} />;
        case 'ui-request_passphrase_on_device':
            return <PassphraseOnDeviceModal device={device} />;
        default:
            return null;
    }
};
