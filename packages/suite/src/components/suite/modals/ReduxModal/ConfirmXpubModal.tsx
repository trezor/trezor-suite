import { selectSelectedAccount } from '@suite/account';
import { Translation } from '@suite/intl';
import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { selectSelectedDevice } from '@suite-common/device';
import { getFirmwareDescriptor } from '@suite-common/wallet-utils';

import { showXpubThunk } from '#src/actions/wallet/publicKeyActions';
import { useSelector } from '#src/hooks/suite/useSelector';

import {
    ConfirmValueModal,
    type ConfirmValueModalProps,
} from './ConfirmValueModal/ConfirmValueModal';
import { ConfirmActionModal } from './DeviceContextModal/ConfirmActionModal';
import { ConnectAddressConfirmation } from './UserContextModal/ConnectAddressConfirmation';
import { ConnectSelectAccount } from './UserContextModal/ConnectSelectAccount/ConnectSelectAccount';

export const ConfirmXpubModal = (
    props: Pick<ConfirmValueModalProps, 'isConfirmed' | 'onCancel'>,
) => {
    const device = useSelector(selectSelectedDevice);
    const account = useSelector(selectSelectedAccount);
    const popupCallState = useSelector(state => selectConnectPopupCall(state)?.state);

    if (popupCallState === 'address-confirmation') return <ConnectAddressConfirmation />;
    // The picker's xpub verification ends with a device modal that nothing replaces afterwards, so
    // the picker has to stay on screen in its place, as it does for ButtonRequest_Address.
    if (popupCallState === 'select-account') return <ConnectSelectAccount />;
    if (!device) return null;
    if (!account) return <ConfirmActionModal device={device} />;

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
