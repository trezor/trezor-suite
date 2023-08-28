import { useState, useEffect, useCallback, ReactNode, FC, HtmlHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import styled, { css } from 'styled-components';
import { typography, spacingsPx, borders } from '@trezor/theme';
import { Icon } from '@suite-common/icons/src/webComponents';
import { motionEasing } from '../../config/motion';

const animationVariants = {
    closed: {
        opacity: 0,
        height: 0,
    },
    expanded: {
        opacity: 1,
        height: 'auto',
    },
};

const Wrapper = styled.div<Pick<CollapsibleBoxProps, 'variant'>>`
    margin-bottom: 20px;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    border-radius: ${borders.radii.sm};

    ${({ variant, theme }) =>
        variant === 'large' &&
        css`
            border-radius: ${borders.radii.md};
            box-shadow: 0 2px 5px 0 ${theme.BOX_SHADOW_BLACK_20}; // TODO: use theme
        `}
`;

const Header = styled.div<Pick<CollapsibleBoxProps, 'variant'>>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: ${spacingsPx.xl};
    padding: ${({ variant }) =>
        variant === 'small'
            ? `${spacingsPx.sm} ${spacingsPx.md}`
            : `${spacingsPx.md} ${spacingsPx.xl}`};
    cursor: pointer;
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    overflow: hidden;
`;

const IconLabel = styled.div`
    margin-right: ${spacingsPx.sm};
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
`;

const Heading = styled.span<Pick<CollapsibleBoxProps, 'variant'>>`
    display: flex;
    align-items: center;
    ${typography.body}
`;

const SubHeading = styled.span`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

const easingValues = motionEasing.transition.join(', ');
const ANIMATION_DURATION = 0.4;
const StyledIcon = styled(Icon)<{ isCollapsed?: boolean }>`
    transform: ${({ isCollapsed }) => (isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)')};
    transition: transform ${ANIMATION_DURATION}s cubic-bezier(${easingValues});
    transform-origin: center;
`;

const Content = styled.div<{
    variant: CollapsibleBoxProps['variant'];
    $noContentPadding?: boolean;
}>`
    display: flex;
    flex-direction: column;
    padding: ${({ $noContentPadding, variant }) =>
        !$noContentPadding &&
        (variant === 'small'
            ? `${spacingsPx.lg} ${spacingsPx.md}`
            : `${spacingsPx.xl} ${spacingsPx.md}`)};
    border-top: 1px solid ${({ theme }) => theme.borderOnElevation1};
    overflow: hidden;
`;

const Collapser = styled(motion.div)`
    overflow: hidden;
`;

export interface CollapsibleBoxProps extends HtmlHTMLAttributes<HTMLDivElement> {
    heading?: React.ReactNode;
    subHeading?: React.ReactNode;
    variant: 'small' | 'large'; // TODO: reevaluate variants
    iconLabel?: React.ReactNode;
    children?: React.ReactNode;
    noContentPadding?: boolean;
    opened?: boolean;
    onCollapse?: () => void;
    headingButton?: ({
        collapsed,
        animatedIcon,
    }: {
        collapsed: boolean;
        animatedIcon: boolean;
    }) => ReactNode;
}

type CollapsibleBoxSubcomponents = {
    Header: typeof Header;
    Heading: typeof Heading;
    Content: typeof Content;
    IconWrapper: typeof IconWrapper;
};

const CollapsibleBox: FC<CollapsibleBoxProps> & CollapsibleBoxSubcomponents = ({
    heading,
    subHeading,
    iconLabel,
    children,
    noContentPadding,
    variant = 'small',
    opened = false,
    onCollapse,
    headingButton,
    ...rest
}: CollapsibleBoxProps) => {
    const [collapsed, setCollapsed] = useState(!opened);
    const [animatedIcon, setAnimatedIcon] = useState(false);

    useEffect(() => {
        setCollapsed(!opened);
    }, [opened]);

    const handleHeaderClick = useCallback(() => {
        onCollapse?.();
        setCollapsed(!collapsed);
        setAnimatedIcon(true);
    }, [collapsed, onCollapse]);

    return (
        <Wrapper variant={variant} {...rest}>
            <Header variant={variant} onClick={handleHeaderClick}>
                <div>
                    <Heading variant={variant}>{heading ?? iconLabel}</Heading>
                    <SubHeading>{subHeading}</SubHeading>
                </div>

                {headingButton ? (
                    headingButton({ collapsed, animatedIcon })
                ) : (
                    <IconWrapper>
                        {iconLabel && <IconLabel>{iconLabel}</IconLabel>}

                        <StyledIcon isCollapsed={collapsed} name="caretCircleDown" size="medium" />
                    </IconWrapper>
                )}
            </Header>

            <Collapser
                initial={false} // Prevents animation on mount when expanded === false
                variants={animationVariants}
                animate={!collapsed ? 'expanded' : 'closed'}
                transition={{ duration: ANIMATION_DURATION, ease: motionEasing.transition }}
                data-test="@collapsible-box/body"
            >
                <Content variant={variant} $noContentPadding={noContentPadding}>
                    {children}
                </Content>
            </Collapser>
        </Wrapper>
    );
};

CollapsibleBox.Header = Header;
CollapsibleBox.Heading = Heading;
CollapsibleBox.Content = Content;
CollapsibleBox.IconWrapper = IconWrapper;

export { CollapsibleBox };
