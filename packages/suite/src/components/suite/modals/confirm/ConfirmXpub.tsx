import { Translation } from 'src/components/suite';
import { ConfirmValueOnDevice, ConfirmDeviceScreenProps } from './ConfirmValueOnDevice';
import { showXpub } from 'src/actions/wallet/publicKeyActions';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { useSelector } from 'src/hooks/suite';

export const ConfirmXpub = (props: Pick<ConfirmDeviceScreenProps, 'isConfirmed' | 'onCancel'>) => {
    const account = useSelector(selectSelectedAccount);
    const { accountLabel } = useSelector(selectLabelingDataForSelectedAccount);

    if (!account) return null;

    return (
        <ConfirmValueOnDevice
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
            validateOnDevice={showXpub}
            copyButtonText={<Translation id="TR_XPUB_MODAL_CLIPBOARD" />}
            value={account.descriptor}
            valueDataTest="@xpub-modal/xpub-field"
            {...props}
        />
    );
};
