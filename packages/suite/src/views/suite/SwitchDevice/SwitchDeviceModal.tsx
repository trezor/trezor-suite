import { Card } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';
import styled from 'styled-components';

type SwitchDeviceModalProps = {
    children?: React.ReactNode;
    isCancelable?: boolean;
    onBackClick?: () => void;
    onCancel?: () => void;
    'data-test'?: string;
};

const Container = styled.div`
    width: 378px;
    margin: ${spacingsPx.xxs};
`;

export const SwitchDeviceModal = ({ children }: SwitchDeviceModalProps) => {
    return <Container>{children}</Container>;
};
