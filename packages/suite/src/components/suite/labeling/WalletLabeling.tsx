import styled from 'styled-components';

import { useWalletLabel } from '@suite/wallet';

import { type TrezorDevice } from 'src/types/suite';

interface WalletLabellingProps {
    device: TrezorDevice;
    shouldUseDeviceLabel?: boolean;
}

const Container = styled.span`
    white-space: nowrap;
`;

export const WalletLabeling = ({ device, shouldUseDeviceLabel }: WalletLabellingProps) => {
    const { label } = useWalletLabel({ device, shouldUseDeviceLabel });

    return <Container>{label}</Container>;
};
