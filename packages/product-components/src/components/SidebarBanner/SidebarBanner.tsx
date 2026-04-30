import { type ReactNode } from 'react';

import { type Variants, motion } from 'framer-motion';

import {
    Button,
    Card,
    Column,
    H4,
    IconCircle,
    type IconName,
    Paragraph,
    Row,
} from '@trezor/components';

type SidebarBannerAnimation = 'drop' | 'shake' | Array<'drop' | 'shake'>;

type SidebarBannerBaseProps = {
    animate?: SidebarBannerAnimation;
    ctaDataTestId?: string;
    ctaLabel: ReactNode;
    'data-testid'?: string;
    description?: ReactNode;
    heading: ReactNode;
    icon: IconName;
    onClick: () => void;
};

type SidebarBannerWithCloseProps = {
    closeLabel: ReactNode;
    onClose: () => void;
};

type SidebarBannerWithoutCloseProps = {
    closeLabel?: undefined;
    onClose?: undefined;
};

export type SidebarBannerProps = SidebarBannerBaseProps &
    (SidebarBannerWithCloseProps | SidebarBannerWithoutCloseProps);

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
    ctaDataTestId,
    ctaLabel,
    closeLabel,
    'data-testid': dataTestId,
    description,
    heading,
    icon,
    onClick,
    onClose,
}: SidebarBannerProps) => (
    <motion.div variants={variants} initial="initial" exit="exit" animate={animate}>
        <Card data-testid={dataTestId} paddingType="none" width="auto">
            <Column gap={12} padding={12}>
                <IconCircle name={icon} size={40} intent="neutral" />
                <Column gap={2}>
                    <H4 typographyStyle="body-sm-strong">{heading}</H4>
                    {description && (
                        <Paragraph intent="neutral" typographyStyle="body-sm">
                            {description}
                        </Paragraph>
                    )}
                </Column>
                <Row gap={10} margin={{ top: 2 }} flexWrap="wrap">
                    <Button
                        intent="brand"
                        type="button"
                        data-testid={ctaDataTestId}
                        onClick={onClick}
                        size="small"
                    >
                        {ctaLabel}
                    </Button>

                    {onClose !== undefined && (
                        <Button
                            intent="neutral"
                            priority="secondary"
                            type="button"
                            onClick={onClose}
                            size="small"
                        >
                            {closeLabel}
                        </Button>
                    )}
                </Row>
            </Column>
        </Card>
    </motion.div>
);
