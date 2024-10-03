import { useState, ReactNode, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import styled, { css } from 'styled-components';
import {
    spacingsPx,
    borders,
    Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
    spacings,
} from '@trezor/theme';
import { Icon } from '../Icon/Icon';
import { Row, Column } from '../Flex/Flex';
import { Text } from '../typography/Text/Text';
import { motionEasing } from '../../config/motion';
import { ElevationUp, useElevation } from './../ElevationContext/ElevationContext';
import {
    FrameProps,
    FramePropsKeys,
    pickAndPrepareFrameProps,
    withFrameProps,
} from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';
import { PaddingType, FillType, HeadingSize } from './types';
import {
    mapPaddingTypeToHeaderPadding,
    mapPaddingTypeToContentPadding,
    mapSizeToHeadingTypography,
    mapSizeToSubheadingTypography,
    mapSizeToIconSize,
} from './utils';

export const allowedCollapsibleBoxFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedCollapsibleBoxFrameProps)[number]>;

const ANIMATION_DURATION = 0.4;

const animationVariants = {
    closed: {
        opacity: 0,
        height: 0,
        transitionEnd: {
            display: 'none',
        },
    },
    expanded: {
        opacity: 1,
        height: 'auto',
        display: 'block',
    },
};

type ContainerProps = {
    $paddingType: PaddingType;
    $elevation: Elevation;
    $fillType: FillType;
};

type HeaderProps = {
    $paddingType: PaddingType;
};

type ContentProps = {
    $paddingType: PaddingType;
    $elevation: Elevation;
    $hasDivider: boolean;
};

export type CollapsibleBoxProps = AllowedFrameProps & {
    heading: ReactNode;
    subHeading?: ReactNode;
    headingSize?: HeadingSize;
    paddingType?: PaddingType;
    fillType?: FillType;
    toggleLabel?: ReactNode;
    toggleComponent?: ReactNode;
    children?: ReactNode;
    hasDivider?: boolean;
    onAnimationComplete?: (isOpen: boolean) => void;
    'data-testid'?: string;
    defaultIsOpen?: boolean;
};

const Container = styled.div<TransientProps<AllowedFrameProps> & ContainerProps>`
    flex: 1;
    width: 100%;
    border-radius: ${borders.radii.sm};
    transition: background 0.3s;
    background: ${mapElevationToBackground};
    border: 1px solid ${mapElevationToBorder};

    ${({ $paddingType, theme }) =>
        $paddingType === 'large' &&
        css`
            border-radius: ${borders.radii.md};
            box-shadow: ${theme.boxShadowBase};
        `}

    ${({ $fillType }) =>
        $fillType === 'none' &&
        css`
            background: none;
            border: none;
            box-shadow: none;
        `}

    ${withFrameProps}
`;

const Toggle = styled.div`
    transition: opacity 0.15s;
`;

const Header = styled.header<HeaderProps>`
    padding: ${mapPaddingTypeToHeaderPadding};
    cursor: pointer;

    &:hover {
        ${Toggle} {
            opacity: 0.5;
        }
    }
`;

const IconWrapper = styled.div<{ $isCollapsed?: boolean }>`
    transform: ${({ $isCollapsed }) => ($isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
    transition: transform ${ANIMATION_DURATION}s cubic-bezier(${motionEasing.transition.join(', ')});
    transform-origin: center;
`;

const Content = styled.div<ContentProps>`
    display: flex;
    flex-direction: column;
    padding: ${mapPaddingTypeToContentPadding};

    ${({ theme, $elevation, $hasDivider }) =>
        $hasDivider &&
        css`
            border-top: 1px solid ${mapElevationToBorder({ $elevation, theme })};
        `}

    ${({ $paddingType, $hasDivider }) => css`
        ${$paddingType === 'none' && $hasDivider && `margin-top: ${spacingsPx.xs};`}
        ${$paddingType !== 'none' && !$hasDivider && `padding-top: 0;`}
    `}
`;

const Collapser = styled(motion.div)`
    overflow: hidden;
`;

export const CollapsibleBox = ({
    defaultIsOpen = false,
    toggleLabel,
    toggleComponent,
    paddingType = 'normal',
    heading,
    subHeading,
    headingSize = 'large',
    fillType = 'default',
    hasDivider = true,
    children,
    onAnimationComplete,
    'data-testid': dataTest,
    ...rest
}: CollapsibleBoxProps) => {
    const { elevation } = useElevation();
    const [isOpen, setIsOpen] = useState(defaultIsOpen);
    const frameProps = pickAndPrepareFrameProps(rest, allowedCollapsibleBoxFrameProps);

    const onClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <Container
            {...frameProps}
            $paddingType={paddingType}
            $elevation={elevation}
            $fillType={fillType}
            data-testid={dataTest}
        >
            <Header $paddingType={paddingType} onClick={onClick}>
                <Row gap={spacings.xs} justifyContent="space-between">
                    <Column alignItems="flex-start">
                        <Text
                            as="div"
                            typographyStyle={mapSizeToHeadingTypography({
                                $headingSize: headingSize,
                            })}
                        >
                            {heading}
                        </Text>
                        {subHeading && (
                            <Text
                                as="div"
                                typographyStyle={mapSizeToSubheadingTypography({
                                    $headingSize: headingSize,
                                })}
                                variant="tertiary"
                            >
                                {subHeading}
                            </Text>
                        )}
                    </Column>
                    <Toggle>
                        <Row gap={spacings.sm}>
                            {toggleLabel && (
                                <Text typographyStyle="hint" variant="tertiary">
                                    {toggleLabel}
                                </Text>
                            )}
                            <IconWrapper $isCollapsed={!isOpen}>
                                {toggleComponent ?? (
                                    <Icon
                                        name="caretCircleDown"
                                        size={mapSizeToIconSize({ $headingSize: headingSize })}
                                        data-testid={`@collapsible-box/icon-${isOpen ? 'expanded' : 'collapsed'}`}
                                        variant="tertiary"
                                    />
                                )}
                            </IconWrapper>
                        </Row>
                    </Toggle>
                </Row>
            </Header>
            <Collapser
                initial={false} // Prevents animation on mount when expanded === false
                variants={animationVariants}
                animate={isOpen ? 'expanded' : 'closed'}
                onAnimationComplete={() => onAnimationComplete?.(isOpen)}
                transition={{
                    duration: ANIMATION_DURATION,
                    ease: motionEasing.transition,
                    opacity: {
                        ease: isOpen ? motionEasing.exit : motionEasing.enter,
                    },
                }}
                data-testid="@collapsible-box/body"
            >
                <Content $elevation={elevation} $paddingType={paddingType} $hasDivider={hasDivider}>
                    <ElevationUp>{children}</ElevationUp>
                </Content>
            </Collapser>
        </Container>
    );
};
