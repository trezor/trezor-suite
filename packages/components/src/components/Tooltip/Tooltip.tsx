import styled from 'styled-components';
import { useMemo, useRef, useState, ReactElement } from 'react';
import { motion, Variants } from 'framer-motion';
import Tippy, { TippyProps } from '@tippyjs/react/headless';
import { Instance } from 'tippy.js';
import { transparentize } from 'polished';
import { borders, boxShadows, spacings, spacingsPx, typography } from '@trezor/theme';

import * as variables from '../../config/variables';
import { Icon } from '../assets/Icon/Icon';
import { IconType } from '../../support/types';

type Cursor = 'inherit' | 'pointer' | 'help' | 'default' | 'not-allowed';

const BoxDefault = styled(motion.div)<{ $maxWidth: string | number }>`
    background: ${({ theme }) => theme.backgroundNeutralBold};
    color: ${({ theme }) => theme.textOnPrimary};
    border-radius: ${borders.radii.sm};
    text-align: left;
    box-shadow: ${boxShadows.elevation3};
    max-width: ${props => props.$maxWidth}px;
    ${typography.hint}
`;

const HeaderContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: ${spacingsPx.xs};
`;

// legacy component – to be removed
const BoxRich = styled(motion.div)<{ $maxWidth: string | number }>`
    padding: 24px;
    background: ${({ theme }) => theme.BG_WHITE_ALT};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    border-radius: ${borders.radii.sm};
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-align: left;
    box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.2);
    max-width: ${props => props.$maxWidth}px;
`;

const StyledTooltipTitle = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
`;

const OpenGuideInner = styled.span`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-left: auto;
`;

const TooltipContent = styled.div`
    padding: ${spacingsPx.xs};
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
    if (placement === 'top') return `translate(0px, ${animationStartOffset}px)`;
    if (placement === 'bottom') return `translate(0px, -${animationStartOffset}px)`;
    if (placement === 'left') return `translate(${animationStartOffset}px, 0px)`;
    if (placement === 'right') return `translate(-${animationStartOffset}px, 0px)`;
    return '';
};

export type TooltipProps = Omit<TippyProps, 'offset'> & {
    rich?: boolean;
    dashed?: boolean;
    offset?: number;
    cursor?: Cursor;
    guideAnchor?: (instance: Instance) => ReactElement;
    title?: React.ReactElement;
    headerIcon?: IconType;
};

export const Tooltip = ({
    placement = 'top',
    interactive = true,
    children,
    rich = false, // legacy prop
    dashed = false,
    duration = 150,
    delay = 200,
    maxWidth = 400,
    offset = 10,
    cursor = 'help',
    content,
    guideAnchor,
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

    const animationVariants = useMemo<Variants>(
        () => ({
            shown: { opacity: 1, transform: 'translate(0px, 0px)' },
            hidden: { opacity: 0, transform: `${getTranslateStyle(placement)}` },
        }),
        [placement],
    );

    const handleOnShow = (instance: Instance) => {
        onShow?.(instance);
        setIsShown(true);
    };

    const handleOnHide = (instance: Instance) => {
        onHide?.(instance);
        setIsShown(false);
    };

    const onAnimateComplete = () => {
        if (isShown) {
            return;
        }
        // @ts-expect-error
        tooltipRef.current?._tippy?.unmount(); //  eslint-disable-line no-underscore-dangle
    };

    if (!content || !children) {
        return <>{children}</>;
    }

    return (
        <div className={className}>
            <Tippy
                zIndex={variables.Z_INDEX.TOOLTIP}
                placement={placement}
                animation={!(guideAnchor && isShown)}
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
                render={(attrs, _content, instance) =>
                    rich ? (
                        <BoxRich
                            $maxWidth={maxWidth}
                            tabIndex={-1}
                            variants={animationVariants}
                            animate={isShown ? 'shown' : 'hidden'}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            onAnimationComplete={onAnimateComplete}
                            {...attrs}
                        >
                            {title && <StyledTooltipTitle>{title}</StyledTooltipTitle>}
                            <div>{content}</div>
                        </BoxRich>
                    ) : (
                        <BoxDefault
                            $maxWidth={maxWidth}
                            tabIndex={-1}
                            variants={animationVariants}
                            animate={isShown ? 'shown' : 'hidden'}
                            transition={{ duration: 0.2, ease: 'easeInOut' }}
                            onAnimationComplete={onAnimateComplete}
                            {...attrs}
                        >
                            {(title || guideAnchor) && (
                                <HeaderContainer>
                                    {title && (
                                        <StyledTooltipTitle>
                                            {headerIcon && (
                                                <Icon icon={headerIcon} size={spacings.md} />
                                            )}
                                            {title}
                                        </StyledTooltipTitle>
                                    )}

                                    {guideAnchor && instance && (
                                        <OpenGuideInner>{guideAnchor(instance)}</OpenGuideInner>
                                    )}
                                </HeaderContainer>
                            )}
                            <TooltipContent>{content}</TooltipContent>
                        </BoxDefault>
                    )
                }
            >
                <Content dashed={dashed} cursor={disabled ? 'default' : cursor}>
                    {children}
                </Content>
            </Tippy>
        </div>
    );
};
