import styled from 'styled-components';
import { useRef, useState, ReactElement, isValidElement } from 'react';
import { motion } from 'framer-motion';
import Tippy, { TippyProps } from '@tippyjs/react/headless';
import { Instance } from 'tippy.js';
import { transparentize } from 'polished';
import { borders, spacings, spacingsPx, typography, zIndices } from '@trezor/theme';

import { Icon, IconType } from '../assets/Icon/Icon';

export const TOOLTIP_DELAY_NONE = 0;
export const TOOLTIP_DELAY_SHORT = 200;
export const TOOLTIP_DELAY_NORMAL = 500;
export const TOOLTIP_DELAY_LONG = 1000;

type Cursor = 'inherit' | 'pointer' | 'help' | 'default' | 'not-allowed';

const getContainerPadding = (isLarge: boolean, isWithHeader: boolean) => {
    if (isLarge) {
        if (isWithHeader) {
            return `${spacingsPx.sm} ${spacingsPx.md} ${spacingsPx.xs}`;
        }

        return `${spacingsPx.xs} ${spacingsPx.md}`;
    }

    return spacingsPx.xs;
};

const Wrapper = styled.div<{ isFullWidth: boolean }>`
    width: ${({ isFullWidth }) => (isFullWidth ? '100%' : 'auto')};
`;

const TooltipContainer = styled(motion.div)<{
    $maxWidth: string | number;
    $isLarge: boolean;
    $isWithHeader: boolean;
}>`
    background: ${({ theme }) => theme.backgroundNeutralBold};
    color: ${({ theme }) => theme.textOnPrimary};
    border-radius: ${borders.radii.sm};
    text-align: left;
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
    max-width: ${props => props.$maxWidth}px;
    ${typography.hint}

    > div {
        padding: ${({ $isLarge, $isWithHeader }) => getContainerPadding($isLarge, $isWithHeader)};
    }
`;

const HeaderContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${spacingsPx.sm};
    width: 100%;
`;

const TooltipTitle = styled.div<{ isLarge: boolean }>`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    width: 100%;
    color: ${({ theme }) => theme.textSubdued};
    ${({ isLarge }) => (isLarge ? typography.highlight : typography.hint)}
`;

const Addon = styled.div`
    margin-left: auto;
`;

const Content = styled.div<{ dashed: boolean; cursor: Cursor }>`
    cursor: ${({ cursor }) => cursor};

    > * {
        border-bottom: ${({ dashed, theme }) =>
            dashed && `1.5px dashed ${transparentize(0.66, theme.TYPE_LIGHT_GREY)}`};
        cursor: ${({ cursor }) => cursor};
    }
`;

const animationStartOffset = 10;
const getTranslateStyle = (placement: TippyProps['placement']) => {
    switch (placement) {
        case 'top':
            return `translate(0px, ${animationStartOffset}px)`;
        case 'bottom':
            return `translate(0px, -${animationStartOffset}px)`;
        case 'left':
            return `translate(${animationStartOffset}px, 0px)`;
        case 'right':
            return `translate(-${animationStartOffset}px, 0px)`;
        default:
            return '';
    }
};
export type TooltipDelay =
    | typeof TOOLTIP_DELAY_NONE
    | typeof TOOLTIP_DELAY_SHORT
    | typeof TOOLTIP_DELAY_NORMAL
    | typeof TOOLTIP_DELAY_LONG;

export type TooltipProps = Omit<TippyProps, 'offset' | 'delay'> & {
    delayShow?: TooltipDelay;
    delayHide?: TooltipDelay;
    /**
     *  @description Legacy prop
     */
    isLarge?: boolean;
    dashed?: boolean;
    offset?: number;
    cursor?: Cursor;
    addon?: (instance: Instance) => ReactElement | ReactElement;
    title?: ReactElement;
    headerIcon?: IconType;
    isFullWidth?: boolean;
};

export const Tooltip = ({
    placement = 'top',
    interactive = true,
    children,
    isLarge = false,
    dashed = false,
    duration = 150,
    delayShow = TOOLTIP_DELAY_SHORT,
    delayHide = TOOLTIP_DELAY_SHORT,
    maxWidth = 400,
    offset = 10,
    cursor = 'help',
    content,
    addon,
    title,
    headerIcon,
    disabled,
    onShow,
    onHide,
    className,
    isFullWidth = false,
    ...rest
}: TooltipProps) => {
    const [isShown, setIsShown] = useState(false);

    const tooltipRef = useRef<Element>(null);

    // set data-test attribute to Tippy https://github.com/atomiks/tippyjs-react/issues/89
    const onCreate = (instance: Instance) => {
        const content = instance.popper;
        content.setAttribute('data-test-id', '@tooltip');
    };

    const animationVariants = {
        shown: { opacity: 1, transform: 'translate(0px, 0px)' },
        hidden: { opacity: 0, transform: `${getTranslateStyle(placement)}` },
    };

    const handleOnShow = (instance: Instance) => {
        onShow?.(instance);
        setIsShown(true);
    };

    const handleOnHide = (instance: Instance) => {
        onHide?.(instance);
        setIsShown(false);
    };

    if (!content || !children) {
        return <>{children}</>;
    }

    return (
        <Wrapper isFullWidth={isFullWidth} className={className}>
            <Tippy
                zIndex={zIndices.tooltip}
                placement={placement}
                animation
                onShow={handleOnShow}
                onHide={handleOnHide}
                duration={duration}
                delay={[delayShow, delayHide]}
                offset={[0, offset]}
                interactive={interactive}
                appendTo={() => document.body}
                onCreate={onCreate}
                ref={tooltipRef}
                disabled={disabled}
                {...rest}
                render={(attrs, _content, instance) => (
                    <TooltipContainer
                        $isLarge={isLarge}
                        $isWithHeader={!!(title || addon)}
                        $maxWidth={maxWidth}
                        tabIndex={-1}
                        variants={animationVariants}
                        animate={isShown ? 'shown' : 'hidden'}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        onAnimationComplete={isShown ? () => {} : instance?.unmount}
                        {...attrs}
                    >
                        {(title || addon) && (
                            <HeaderContainer>
                                {title && (
                                    <TooltipTitle isLarge={isLarge}>
                                        {headerIcon && (
                                            <Icon icon={headerIcon} size={spacings.md} />
                                        )}
                                        {title}
                                    </TooltipTitle>
                                )}

                                {addon && instance && (
                                    <Addon>{isValidElement(addon) ? addon : addon(instance)}</Addon>
                                )}
                            </HeaderContainer>
                        )}

                        <div>{content}</div>
                    </TooltipContainer>
                )}
            >
                <Content dashed={dashed} cursor={disabled ? 'default' : cursor}>
                    {children}
                </Content>
            </Tippy>
        </Wrapper>
    );
};
