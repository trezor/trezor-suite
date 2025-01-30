import { getNetwork } from '@suite-common/wallet-config';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import { convertTaprootXpub } from '@trezor/utils';

import { showXpub } from 'src/actions/wallet/publicKeyActions';
import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { ConfirmValueModal, ConfirmValueModalProps } from './ConfirmValueModal/ConfirmValueModal';
import { ConfirmActionModal } from './DeviceContextModal/ConfirmActionModal';

export const ConfirmXpubModal = (
    props: Pick<ConfirmValueModalProps, 'isConfirmed' | 'onCancel'>,
) => {
    const device = useSelector(selectSelectedDevice);
    const account = useSelector(selectSelectedAccount);
    const { accountLabel } = useSelector(selectLabelingDataForSelectedAccount);

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
            heading={
                accountLabel ? (
                    <Translation id="TR_XPUB_MODAL_TITLE_METADATA" values={{ accountLabel }} />
                ) : (
                    <Translation
                        id="TR_XPUB_MODAL_TITLE"
                        values={{
                            networkName: getNetwork(account.symbol).name,
                            accountIndex: `#${account.index + 1}`,
                        }}
                    />
                )
            }
            stepLabel={<Translation id="TR_XPUB" />}
            validateOnDevice={showXpub}
            copyButtonText={<Translation id="TR_XPUB_MODAL_CLIPBOARD" />}
            value={xpubWithReplacedApostropheWithH ?? xpub}
            {...props}
        />
    );
};
