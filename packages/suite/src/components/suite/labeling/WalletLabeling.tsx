import { TrezorDevice } from 'src/types/suite';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectLabelingDataForWallet } from 'src/reducers/suite/metadataReducer';

interface WalletLabellingProps {
    device: TrezorDevice;
    shouldUseDeviceLabel?: boolean;
}

export const WalletLabeling = ({ device, shouldUseDeviceLabel }: WalletLabellingProps) => {
    const { translationString } = useTranslation();
    const { walletLabel } = useSelector(state => selectLabelingDataForWallet(state, device.state));

    let label: string | undefined;
    if (device.metadata.status === 'enabled' && walletLabel) {
        label = walletLabel;
    } else if (device.state) {
        label = device.useEmptyPassphrase
            ? translationString('TR_NO_PASSPHRASE_WALLET')
            : translationString('TR_PASSPHRASE_WALLET', { id: device.walletNumber });
    }

    if (shouldUseDeviceLabel) {
        return <>{`${device.label} ${label}`}</>;
    }

    if (!label) return null;

    return <span>{label}</span>;
};
