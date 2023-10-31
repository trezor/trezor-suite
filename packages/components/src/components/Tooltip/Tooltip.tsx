import styled from 'styled-components';
import { useRef, useState, ReactElement, isValidElement } from 'react';
import { motion } from 'framer-motion';
import Tippy, { TippyProps } from '@tippyjs/react/headless';
import { Instance } from 'tippy.js';
import { transparentize } from 'polished';
import { borders, boxShadows, spacings, spacingsPx, typography, zIndices } from '@trezor/theme';

import { Icon, IconType } from '../assets/Icon/Icon';

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

const TooltipContainer = styled(motion.div)<{
    $maxWidth: string | number;
    $isLarge: boolean;
    $isWithHeader: boolean;
}>`
    background: ${({ theme }) => theme.backgroundNeutralBold};
    color: ${({ theme }) => theme.textOnPrimary};
    border-radius: ${borders.radii.sm};
    text-align: left;
    box-shadow: ${boxShadows.elevation3};
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

export type TooltipProps = Omit<TippyProps, 'offset'> & {
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
};

export const Tooltip = ({
    placement = 'top',
    interactive = true,
    children,
    isLarge = false,
    dashed = false,
    duration = 150,
    delay = 200,
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
    ...rest
}: TooltipProps) => {
    const [isShown, setIsShown] = useState(false);

    const tooltipRef = useRef<Element>(null);

    // set data-test attribute to Tippy https://github.com/atomiks/tippyjs-react/issues/89
    const onCreate = (instance: Instance) => {
        const content = instance.popper;
        content.setAttribute('data-test', '@tooltip');
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
        <div className={className}>
            <Tippy
                zIndex={zIndices.tooltip}
                placement={placement}
                animation
                onShow={handleOnShow}
                onHide={handleOnHide}
                duration={duration}
                delay={delay}
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
        </div>
    );
};
