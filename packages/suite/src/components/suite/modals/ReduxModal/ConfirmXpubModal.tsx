import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import { getFirmwareDescriptor } from '@suite-common/wallet-utils';

import { showXpubThunk } from 'src/actions/wallet/publicKeyActions';
import { useSelector } from 'src/hooks/suite';

import {
    ConfirmValueModal,
    type ConfirmValueModalProps,
} from './ConfirmValueModal/ConfirmValueModal';
import { ConfirmActionModal } from './DeviceContextModal/ConfirmActionModal';
import { ConnectAddressConfirmation } from './UserContextModal/ConnectAddressConfirmation';

export const ConfirmXpubModal = (
    props: Pick<ConfirmValueModalProps, 'isConfirmed' | 'onCancel'>,
) => {
    const device = useSelector(selectSelectedDevice);
    const account = useSelector(selectSelectedAccount);
    const isConnectPopup = useSelector(
        state => selectConnectPopupCall(state)?.state === 'address-confirmation',
    );

    if (isConnectPopup) return <ConnectAddressConfirmation />;
    if (!device) return null;
    // TODO: special case for Connect Popup
    if (!account) return <ConfirmActionModal device={device} />;

    // Firmware shows taproot descriptors with 'h' where Suite stores '; display the matching form.
    const xpub = getFirmwareDescriptor(account, { withChecksum: true });

    return (
        <ConfirmValueModal
            account={account}
            heading={<Translation id="TR_XPUB" />}
            validateOnDevice={showXpubThunk}
            value={xpub}
            isValueChunked={false}
            data-testid="@metadata/copy-xpub-button"
            {...props}
        />
    );
};
