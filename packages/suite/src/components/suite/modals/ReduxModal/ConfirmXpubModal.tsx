import { Translation } from 'src/components/suite';
import { ConfirmValueModal, ConfirmValueModalProps } from './ConfirmValueModal/ConfirmValueModal';
import { showXpub } from 'src/actions/wallet/publicKeyActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { useSelector } from 'src/hooks/suite';

export const ConfirmXpubModal = (
    props: Pick<ConfirmValueModalProps, 'isConfirmed' | 'onCancel'>,
) => {
    const account = useSelector(selectSelectedAccount);
    const { accountLabel } = useSelector(selectLabelingDataForSelectedAccount);

    if (!account) return null;

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
            value={account.descriptor}
            valueDataTest="@xpub-modal/xpub-field"
            {...props}
        />
    );
};
