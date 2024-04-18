import { ElevationContext } from '@trezor/components';
import { useEvent } from 'react-use';
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
    margin: 5px;
`;

export const SwitchDeviceModal = ({
    children,
    onCancel,
    'data-test': dataTest = '@modal',
}: SwitchDeviceModalProps) => {
    useEvent('keydown', (e: KeyboardEvent) => {
        if (onCancel && e.key === 'Escape') {
            onCancel?.();
        }
    });

    return (
        <ElevationContext baseElevation={1}>
            <Container
                onClick={e => e.stopPropagation()} // needed because of the Backdrop implementation
                data-test={dataTest}
            >
                {children}
            </Container>
        </ElevationContext>
    );
};
