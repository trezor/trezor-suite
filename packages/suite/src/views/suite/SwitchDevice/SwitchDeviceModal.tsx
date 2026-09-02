import { useEvent } from 'react-use';

import { motion } from 'framer-motion';
import styled from 'styled-components';

import { TrafficLightOffset } from '@suite/macos';
import { selectConnectPopupCall } from '@suite-common/connect-popup';
import { Column, Modal } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

type SwitchDeviceModalProps = {
    children?: React.ReactNode;
    onCancel?: () => void;
    'data-testid'?: string;
    isAnimationEnabled?: boolean;
};

const Container = styled.div`
    width: 378px;
    -webkit-app-region: no-drag;
`;

const initial = {
    width: 279,
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

    const connectPopupCall = useSelector(selectConnectPopupCall);
    const isInConnectPopup = connectPopupCall && connectPopupCall.state !== 'finished';

    return (
        <Modal.Backdrop
            onClick={onCancel}
            data-testid={`${dataTest}/backdrop`}
            alignment={{ x: 'start', y: 'start' }}
            padding={8}
            opaque={isInConnectPopup}
            isContentScrollable
        >
            <TrafficLightOffset expand={false}>
                <Container data-testid={`${dataTest}/switch-device`}>
                    <Column alignItems="flex-start" gap={16} flex="1">
                        <motion.div
                            initial={isAnimationEnabled ? initial : false}
                            exit={initial}
                            animate={{
                                width: 369,
                                height: 'auto',
                            }}
                            style={{
                                originX: 0,
                                originY: 0,
                            }}
                        >
                            {children}
                        </motion.div>
                    </Column>
                </Container>
            </TrafficLightOffset>
        </Modal.Backdrop>
    );
};
