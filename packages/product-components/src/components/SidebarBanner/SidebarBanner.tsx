import { type ReactNode } from 'react';

import { type Variants, motion } from 'framer-motion';

import {
    Box,
    Button,
    type ButtonProps,
    Column,
    H4,
    IconButton,
    IconCircle,
    type IconComponent,
    Paragraph,
    Row,
} from '@trezor/components';
import { XIcon } from '@trezor/icons';

type SidebarBannerAnimation = 'drop' | 'shake' | Array<'drop' | 'shake'>;

type SidebarBannerWithIconProps = {
    heroContent?: never;
    icon: IconComponent;
};

type SidebarBannerWithHeroContentProps = {
    heroContent: ReactNode;
    icon?: never;
};

type SidebarBannerWithCloseProps = {
    closeLabel: ReactNode;
    onClose: ButtonProps['onClick'];
};

type SidebarBannerWithoutCloseProps = {
    closeLabel?: undefined;
    onClose?: undefined;
};

type SidebarBannerBaseProps = {
    animate?: SidebarBannerAnimation;
    ctaDataTestId?: string;
    ctaLabel: ReactNode;
    'data-testid'?: string;
    description?: ReactNode;
    heading: ReactNode;
    intent?: ButtonProps['intent'];
    onClick: ButtonProps['onClick'];
    ctaHref?: ButtonProps['href'];
};

export type SidebarBannerProps = SidebarBannerBaseProps &
    (SidebarBannerWithIconProps | SidebarBannerWithHeroContentProps) &
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
    heroContent,
    intent = 'brand',
    onClick,
    onClose,
    ctaHref,
}: SidebarBannerProps) => (
    <motion.div variants={variants} initial="initial" exit="exit" animate={animate}>
        <Box
            data-testid={dataTestId}
            width="auto"
            shadow="surfaceShadowModeless"
            borderRadius={16}
            backgroundColor="surfaceFillModeless"
            borderWidth={1}
            borderColor="surfaceBorderModeless"
        >
            <Column gap={16} padding={12}>
                {icon ? (
                    <IconCircle icon={icon} size={40} intent={intent} />
                ) : (
                    <Box margin={{ top: -12, horizontal: -12 }}>{heroContent}</Box>
                )}
                <Column gap={4}>
                    <H4 typographyStyle="body-md-strong">{heading}</H4>
                    {description && (
                        <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                            {description}
                        </Paragraph>
                    )}
                </Column>
                <Row gap={8} flexWrap="wrap">
                    <Button
                        intent={intent}
                        type="button"
                        data-testid={ctaDataTestId}
                        href={ctaHref}
                        onClick={onClick}
                        size="medium"
                        flex="1"
                    >
                        {ctaLabel}
                    </Button>
                    {onClose !== undefined && (
                        <IconButton
                            icon={XIcon}
                            intent={intent}
                            priority="secondary"
                            data-testid={`${dataTestId}/close-button`}
                            onClick={onClose}
                            size="medium"
                            tooltip={{ content: closeLabel }}
                        />
                    )}
                </Row>
            </Column>
        </Box>
    </motion.div>
);
