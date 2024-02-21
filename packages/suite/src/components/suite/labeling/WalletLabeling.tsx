import { TrezorDevice } from 'src/types/suite';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectLabelingDataForWallet } from 'src/reducers/suite/metadataReducer';
import { useCallback } from 'react';
import styled from 'styled-components';

interface WalletLabellingProps {
    device: TrezorDevice;
    shouldUseDeviceLabel?: boolean;
}

const Container = styled.span`
    white-space: nowrap;
`;

export const useWalletLabeling = () => {
    const { translationString } = useTranslation();

    const defaultAccountLabelString = useCallback(
        ({ device }: { device: TrezorDevice }) =>
            device.useEmptyPassphrase
                ? translationString('TR_NO_PASSPHRASE_WALLET')
                : translationString('TR_PASSPHRASE_WALLET', { id: device.walletNumber }),
        [translationString],
    );

    return {
        defaultAccountLabelString,
    };
};

export const useGetWalletLabel = ({ device, shouldUseDeviceLabel }: WalletLabellingProps) => {
    const { defaultAccountLabelString } = useWalletLabeling();
    const { walletLabel } = useSelector(state => selectLabelingDataForWallet(state, device.state));

    let label: string | undefined;
    if (walletLabel) {
        label = walletLabel;
    } else if (device.state) {
        label = defaultAccountLabelString({ device });
    }

    if (shouldUseDeviceLabel) {
        return <>{`${device.label} ${label}`}</>;
    }

    if (!label) return null;

    return label;
};

export const WalletLabeling = ({ device, shouldUseDeviceLabel }: WalletLabellingProps) => {
    const label = useGetWalletLabel({ device, shouldUseDeviceLabel });

    return <Container>{label}</Container>;
};
