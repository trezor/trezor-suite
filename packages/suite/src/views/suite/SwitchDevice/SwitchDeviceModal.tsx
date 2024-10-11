import { useEvent } from 'react-use';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { spacings } from '@trezor/theme';
import { NewModal, Column } from '@trezor/components';
import { TrafficLightOffset } from '../../../components/suite/TrafficLightOffset';

type SwitchDeviceModalProps = {
    children?: React.ReactNode;
    onCancel?: () => void;
    'data-testid'?: string;
    isAnimationEnabled?: boolean;
};

const Container = styled.div`
    width: 378px;
`;

const initial = {
    width: 279,
    height: 70,
};

export const SwitchDeviceModal = ({
    children,
    onCancel,
    isAnimationEnabled,
    'data-testid': dataTest = '@modal',
}: SwitchDeviceModalProps) => {
    useEvent('keydown', (e: KeyboardEvent) => {
        if (onCancel && e.key === 'Escape') {
            onCancel?.();
        }
    });

    return (
        <NewModal.Backdrop onClick={onCancel} alignment={{ x: 'left', y: 'top' }} padding={5}>
            <TrafficLightOffset>
                <Container
                    onClick={e => e.stopPropagation()} // needed because of the Backdrop implementation
                    data-testid={dataTest}
                >
                    <Column alignItems="flex-start" gap={spacings.md} flex="1">
                        <motion.div
                            initial={isAnimationEnabled ? initial : false}
                            exit={initial}
                            animate={{
                                width: 369,
                                height: 'auto',
                            }}
                            style={{ originX: 0, originY: 0, overflow: 'hidden' }}
                        >
                            {children}
                        </motion.div>
                    </Column>
                </Container>
            </TrafficLightOffset>
        </NewModal.Backdrop>
    );
};
