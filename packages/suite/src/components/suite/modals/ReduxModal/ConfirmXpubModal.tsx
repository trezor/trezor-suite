import { selectSelectedDevice } from '@suite-common/wallet-core';
import { convertTaprootXpub } from '@trezor/utils';

import { showXpub } from 'src/actions/wallet/publicKeyActions';
import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { ConfirmValueModal, ConfirmValueModalProps } from './ConfirmValueModal/ConfirmValueModal';
import { ConfirmActionModal } from './DeviceContextModal/ConfirmActionModal';

export const ConfirmXpubModal = (
    props: Pick<ConfirmValueModalProps, 'isConfirmed' | 'onCancel'>,
) => {
    const device = useSelector(selectSelectedDevice);
    const account = useSelector(selectSelectedAccount);

    if (!device) return null;
    // TODO: special case for Connect Popup
    if (!account) return <ConfirmActionModal device={device} />;

    const xpub =
        account.descriptorChecksum !== undefined
            ? `${account.descriptor}#${account.descriptorChecksum}`
            : account.descriptor;

    // Suite internally uses apostrophe, but FW uses 'h' for taproot descriptors,
    // and we want to show it correctly to the user
    const xpubWithReplacedApostropheWithH = convertTaprootXpub({
        xpub,
        direction: 'apostrophe-to-h',
    });

    return (
        <ConfirmValueModal
            account={account}
            heading={<Translation id="TR_XPUB" />}
            validateOnDevice={showXpub}
            isCopyButtonVisible={true}
            value={xpubWithReplacedApostropheWithH ?? xpub}
            data-testid="@metadata/copy-xpub-button"
            {...props}
        />
    );
};
