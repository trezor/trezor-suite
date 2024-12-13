import { selectSelectedDevice } from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite';
import { showXpub } from 'src/actions/wallet/publicKeyActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { useSelector } from 'src/hooks/suite';
import { DisplayMode } from 'src/types/suite';

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
                            networkName: account.symbol.toUpperCase(),
                            accountIndex: `#${account.index + 1}`,
                        }}
                    />
                )
            }
            stepLabel={<Translation id="TR_XPUB" />}
            confirmStepLabel={<Translation id="TR_XPUB_MATCH" />}
            validateOnDevice={showXpub}
            copyButtonText={<Translation id="TR_XPUB_MODAL_CLIPBOARD" />}
            value={xpub}
            displayMode={DisplayMode.PAGINATED_TEXT}
            {...props}
        />
    );
};
