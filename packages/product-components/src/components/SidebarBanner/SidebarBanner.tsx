import { type MouseEvent, type ReactNode } from 'react';

import { type Variants, motion } from 'framer-motion';

import { Card, Column, ElevationContext, IconButton, Row } from '@trezor/components';

type SidebarBannerProps = {
    animate?: string | string[];
    children: ReactNode;
    'data-testid'?: string;
    onClick?: () => void;
    onClose?: () => void;
};

const variants: Variants = {
    initial: { y: 32, opacity: 0 },
    exit: { y: 32, opacity: 0 },
    drop: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            mass: 1,
            stiffness: 266.7,
            damping: 10,
        },
    },
    shake: {
        rotate: [0, -1, 1, 0],
        x: [0, -4, 4, 0],
        transition: {
            duration: 1.2,
            ease: 'easeInOut',
            delay: 10,
        },
    },
};

export const SidebarBanner = ({
    animate = 'drop',
    children,
    'data-testid': dataTestId,
    onClick,
    onClose,
}: SidebarBannerProps) => {
    const handleOnClose = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onClose?.();
    };

    return (
        <ElevationContext baseElevation={0}>
            <motion.div variants={variants} initial="initial" exit="exit" animate={animate}>
                <Card
                    onClick={onClick}
                    data-testid={dataTestId}
                    margin={12}
                    paddingType="small"
                    width="auto"
                >
                    {onClose ? (
                        <Row gap={12}>
                            <Column flex="1" alignItems="start">
                                {children}
                            </Column>
                            <IconButton
                                intent="neutral"
                                priority="secondary"
                                icon="x"
                                size="small"
                                onClick={handleOnClose}
                            />
                        </Row>
                    ) : (
                        children
                    )}
                </Card>
            </motion.div>
        </ElevationContext>
    );
};
