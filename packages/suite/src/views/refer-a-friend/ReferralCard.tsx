import { type MouseEvent } from 'react';

import { motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import styled, { useTheme } from 'styled-components';

import { Translation } from '@suite/intl';
import { Box, Column, Icon, SvgImage, Text, Tooltip } from '@trezor/components';
import { TrezorLogoIcon } from '@trezor/icons';
import { breakpoints } from '@trezor/theme';

import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

const TiltArea = styled.div`
    flex: 0 1 365px;
    min-width: 0;
    aspect-ratio: 16 / 9;
`;

const TiltCard = styled(motion.div)`
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    background: ${({ theme }) => theme.contentBrandHovered};
    transform-style: preserve-3d;
    overflow: hidden;
`;

const INITIAL_TILT = { px: 0, py: 0, active: false };

type ReferralCardProps = {
    rewardAmount: string;
    minimumOrderAmount: string;
    friendDiscountPercentage: number;
};

export const ReferralCard = ({
    rewardAmount,
    minimumOrderAmount,
    friendDiscountPercentage,
}: ReferralCardProps) => {
    const isNarrowContent = useIsContentBelowBreakpoint(breakpoints.tablet);
    const tilt = useMotionValue(INITIAL_TILT);
    const shouldReduceMotion = useReducedMotion();
    const theme = useTheme();
    const border = `inset 0 0 0 1px ${theme.elementBorderOnDarkField}`;
    const translationValues = { rewardAmount, minimumOrderAmount, friendDiscountPercentage };

    const transform = useTransform(
        tilt,
        ({ px, py, active }) =>
            `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateZ(${active ? 6 : 0}px)`,
    );
    const boxShadow = useTransform(tilt, ({ px, py, active }) =>
        active
            ? `${-px * 14}px ${-py * 14 + 12}px 20px -2px ${theme.shadowKeyActionHover}, 0 0 12px ${theme.shadowAmbientActionHover}, ${border}`
            : `${theme.elementShadowElevated}, ${border}`,
    );
    const transition = useTransform(tilt, ({ active }) =>
        active || shouldReduceMotion
            ? 'none'
            : 'transform 320ms cubic-bezier(0.2, 0, 0, 1), box-shadow 320ms cubic-bezier(0.2, 0, 0, 1)',
    );
    const willChange = useTransform(tilt, ({ active }) => (active ? 'transform' : 'auto'));

    const onMove = (event: MouseEvent<HTMLDivElement>) => {
        if (shouldReduceMotion) return;

        const rect = event.currentTarget.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const px = Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5));
        const py = Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5));

        tilt.set({ px, py, active: true });
    };

    const onLeave = () => {
        tilt.set(INITIAL_TILT);
    };

    return (
        <TiltArea onMouseMove={onMove} onMouseLeave={onLeave}>
            <TiltCard style={{ transform, boxShadow, transition, willChange }}>
                <Box
                    position={{ type: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    pointerEvents="none"
                    zIndex={0}
                >
                    <SvgImage
                        color="elementFillOnDarkSoftDisabled"
                        image="REFERRAL_PATTERN"
                        width="100%"
                        height="100%"
                    />
                </Box>
                <Box position={{ type: 'absolute', top: 12, right: 10 }} zIndex={1}>
                    <Icon as={TrezorLogoIcon} size={32} color="contentBrandHovered" />
                </Box>
                <Box position={{ type: 'relative' }} zIndex={1}>
                    <Text color="contentOnDarkBrand" typographyStyle="body-sm" as="div">
                        <Column
                            padding={{ horizontal: 20, vertical: 16 }}
                            gap={12}
                            alignItems="flex-start"
                        >
                            <Column alignItems="flex-start">
                                <Text>
                                    <Translation id="TR_REFERRAL_CARD_YOU_GET" />
                                </Text>
                                <Text
                                    typographyStyle={
                                        isNarrowContent ? 'headline-sm' : 'headline-md'
                                    }
                                >
                                    <Translation
                                        id="TR_REFERRAL_CARD_VOUCHER"
                                        values={translationValues}
                                    />
                                </Text>
                            </Column>
                            <Column alignItems="flex-start">
                                <Tooltip
                                    content={
                                        <Translation
                                            id="TR_REFERRAL_CARD_FRIEND_DISCOUNT_TOOLTIP"
                                            values={translationValues}
                                        />
                                    }
                                    hasIcon
                                    placement="bottom"
                                >
                                    <Text>
                                        <Translation id="TR_REFERRAL_CARD_THEY_GET" />
                                    </Text>
                                </Tooltip>
                                <Text
                                    typographyStyle={
                                        isNarrowContent ? 'headline-sm' : 'headline-md'
                                    }
                                >
                                    <Translation
                                        id="TR_REFERRAL_CARD_FRIEND_DISCOUNT"
                                        values={translationValues}
                                    />
                                </Text>
                            </Column>
                        </Column>
                    </Text>
                </Box>
            </TiltCard>
        </TiltArea>
    );
};
