import { useEvent } from 'react-use';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { spacingsPx } from '@trezor/theme';
import { isDesktop, isMacOs } from '@trezor/env-utils';

type SwitchDeviceModalProps = {
    children?: React.ReactNode;
    isCancelable?: boolean;
    onBackClick?: () => void;
    onCancel?: () => void;
    'data-test'?: string;
    isAnimationEnabled?: boolean;
};

const Container = styled.div<{ $hasTopPadding?: boolean }>`
    width: 378px;
    margin: 5px;
    ${({ $hasTopPadding }) => $hasTopPadding && `margin-top: ${spacingsPx.xxxl};`}
`;

const DeviceItemsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: ${spacingsPx.md};
    flex: 1;
`;

const initial = {
    width: 279,
    height: 70,
};

export const SwitchDeviceModal = ({
    children,
    onCancel,
    isAnimationEnabled,
    'data-test': dataTest = '@modal',
}: SwitchDeviceModalProps) => {
    useEvent('keydown', (e: KeyboardEvent) => {
        if (onCancel && e.key === 'Escape') {
            onCancel?.();
        }
    });

    const isMac = isMacOs();
    const isDesktopApp = isDesktop();

    return (
        <Container
            onClick={e => e.stopPropagation()} // needed because of the Backdrop implementation
            data-test={dataTest}
            $hasTopPadding={isMac && isDesktopApp}
        >
            <DeviceItemsWrapper>
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
            </DeviceItemsWrapper>
        </Container>
    );
};
