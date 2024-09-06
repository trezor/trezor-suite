import { useState, useCallback, ReactNode, FC, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import styled, { css } from 'styled-components';
import {
    typography,
    spacingsPx,
    borders,
    Elevation,
    mapElevationToBackground,
    mapElevationToBorder,
} from '@trezor/theme';
import { Icon } from '../Icon/Icon';
import { motionEasing } from '../../config/motion';
import { ElevationUp, useElevation } from './../ElevationContext/ElevationContext';
import { FrameProps, FramePropsKeys, withFrameProps } from '../../utils/frameProps';
import { TransientProps } from '../../utils/transientProps';

export const allowedCollapsibleBoxFrameProps = ['margin'] as const satisfies FramePropsKeys[];
type AllowedFrameProps = Pick<FrameProps, (typeof allowedCollapsibleBoxFrameProps)[number]>;

const ANIMATION_DURATION = 0.4;

export const paddingTypes = ['none', 'normal', 'large'] as const;
export type PaddingType = (typeof paddingTypes)[number];

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

type FillType = 'default' | 'none';

type WrapperProps = {
    $paddingType: PaddingType;
    $elevation: Elevation;
};

type HeaderProps = {
    $paddingType: PaddingType;
};

type ContentProps = {
    $paddingType: PaddingType;
    $elevation: Elevation;
    $fillType: FillType;
    $hasDivider: boolean;
};

export type CollapsibleBoxProps = CollapsibleBoxManagedProps | CollapsibleBoxUnmanagedProps;

type CollapsibleBoxCommon = AllowedFrameProps & {
    heading?: ReactNode;
    subHeading?: ReactNode;
    paddingType?: 'none' | 'normal' | 'large';
    fillType?: FillType; //@TODO unify naming with other components
    iconLabel?: ReactNode;
    children?: ReactNode;
    isIconFlipped?: boolean; // Open upwards, affects the icon rotation
    hasDivider?: boolean;
    onAnimationComplete?: (isOpen: boolean) => void;
    'data-testid'?: string;
    /** @deprecated */
    className?: string;
};
type CollapsibleBoxSubcomponents = {
    Header: typeof Header;
    Heading: typeof Heading;
    Content: typeof Content;
    IconWrapper: typeof IconWrapper;
};

type CollapsibleBoxManagedProps = CollapsibleBoxCommon & {
    isOpen: boolean;
    onToggle: (isOpen: boolean) => void;
};

type CollapsibleBoxUnmanagedProps = CollapsibleBoxCommon & {
    defaultIsOpen?: boolean;
};

type CollapsibleBoxContentProps = CollapsibleBoxManagedProps;

const Container = styled.div<TransientProps<AllowedFrameProps>>`
    flex: 1;
    width: 100%;

    ${withFrameProps}
`;

const Filled = styled.div<WrapperProps>`
    background: ${mapElevationToBackground};
    border-radius: ${borders.radii.sm};
    border: 1px solid ${mapElevationToBorder};

    /* when theme changes from light to dark */
    transition: background 0.3s;

    ${({ $paddingType, theme }) =>
        $paddingType === 'large' &&
        css`
            border-radius: ${borders.radii.md};
            box-shadow: ${theme.boxShadowBase};
        `}
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    margin-left: auto;
    overflow: hidden;
    transition: opacity 0.15s;
`;

const headerPaddingTypeMap: Record<PaddingType, string> = {
    none: `0`,
    normal: `${spacingsPx.sm} ${spacingsPx.md}`,
    large: `${spacingsPx.md} ${spacingsPx.xl}`,
};

const Header = styled.div<HeaderProps>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${spacingsPx.xl};
    padding: ${({ $paddingType }) => headerPaddingTypeMap[$paddingType]};
    cursor: pointer;

    &:hover {
        ${IconWrapper} {
            opacity: 0.5;
        }
    }
`;

const IconLabel = styled.div`
    margin-right: ${spacingsPx.sm};
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
`;

const Heading = styled.span<HeaderProps>`
    display: flex;
    align-items: center;
    ${typography.body}
`;

const SubHeading = styled.span`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

const Flex = styled.div`
    flex: 1;
`;

const easingValues = motionEasing.transition.join(', ');
const StyledIcon = styled(Icon)<{ $isCollapsed?: boolean }>`
    transform: ${({ $isCollapsed }) => ($isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)')};

    /* to sync with the expand animation */
    transition: transform ${ANIMATION_DURATION}s cubic-bezier(${easingValues});
    transform-origin: center;
`;

const contentPaddingTypeMap: Record<PaddingType, string> = {
    none: '0',
    normal: `${spacingsPx.lg} ${spacingsPx.md}`,
    large: `${spacingsPx.xl} ${spacingsPx.md}`,
};

const Content = styled.div<ContentProps>`
    display: flex;
    flex-direction: column;
    padding: ${({ $paddingType }) => contentPaddingTypeMap[$paddingType]};

    ${({ $fillType, theme, $elevation, $hasDivider }) =>
        $fillType &&
        $hasDivider &&
        css`
            border-top: 1px solid ${mapElevationToBorder({ $elevation, theme })};
        `}
`;

const Collapser = styled(motion.div)`
    overflow: hidden;
`;

const CollapsibleBoxContent = ({
    isOpen,
    onToggle,
    iconLabel,
    paddingType = 'normal',
    heading,
    subHeading,
    isIconFlipped = false,
    fillType = 'default',
    hasDivider = true,
    children,
    margin,
    className,
    onAnimationComplete,
    'data-testid': dataTest,
}: CollapsibleBoxContentProps) => {
    const { elevation } = useElevation();

    const handleHeaderClick = useCallback(
        (e: MouseEvent<HTMLDivElement>) => {
            onToggle?.(!isOpen);
            e.preventDefault();
            e.stopPropagation();
        },
        [onToggle, isOpen],
    );

    const content = (
        <>
            <Header $paddingType={paddingType} onClick={handleHeaderClick}>
                {(heading || subHeading) && (
                    <Flex>
                        {heading && <Heading $paddingType={paddingType}>{heading}</Heading>}
                        {subHeading && <SubHeading>{subHeading}</SubHeading>}
                    </Flex>
                )}

                <IconWrapper>
                    {iconLabel && <IconLabel>{iconLabel}</IconLabel>}
                    <StyledIcon
                        $isCollapsed={isIconFlipped ? isOpen : !isOpen}
                        onClick={() => {
                            onToggle?.(!isOpen);
                        }}
                        name="caretCircleDown"
                        size="medium"
                        data-testid={`@collapsible-box/icon-${isOpen ? 'expanded' : 'collapsed'}`}
                    />
                </IconWrapper>
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
                <Content
                    $elevation={elevation}
                    $paddingType={paddingType}
                    $fillType={fillType}
                    $hasDivider={hasDivider}
                >
                    <ElevationUp>{children}</ElevationUp>
                </Content>
            </Collapser>
        </>
    );

    const containerProps = {
        $margin: margin,
        'data-testid': dataTest,
        className,
    };

    return fillType === 'default' ? (
        <Container {...containerProps}>
            <Filled $paddingType={paddingType} $elevation={elevation}>
                {content}
            </Filled>
        </Container>
    ) : (
        <Container {...containerProps}>{content}</Container>
    );
};

const CollapsibleBoxManaged = ({ isOpen, onToggle, ...rest }: CollapsibleBoxManagedProps) => (
    <CollapsibleBoxContent {...rest} isOpen={isOpen} onToggle={onToggle} />
);

const CollapsibleBoxUnmanaged = ({
    defaultIsOpen = false,
    ...rest
}: CollapsibleBoxUnmanagedProps) => {
    const [isOpen, onToggle] = useState(defaultIsOpen);

    return <CollapsibleBoxContent {...rest} isOpen={isOpen} onToggle={onToggle} />;
};

const CollapsibleBox: FC<CollapsibleBoxProps> & CollapsibleBoxSubcomponents = (
    props: CollapsibleBoxProps,
) => {
    if ('isOpen' in props && props.isOpen !== undefined) {
        return <CollapsibleBoxManaged {...props} />;
    } else {
        return <CollapsibleBoxUnmanaged {...props} />;
    }
};

CollapsibleBox.Header = Header;
CollapsibleBox.Heading = Heading;
CollapsibleBox.Content = Content;
CollapsibleBox.IconWrapper = IconWrapper;

export { CollapsibleBox };
