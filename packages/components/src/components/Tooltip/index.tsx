import styled from 'styled-components';
import React, { ReactNode } from 'react';
import { useSpring, animated } from 'react-spring';
import Tippy, { TippyProps } from '@tippyjs/react/headless';
import { Instance, Props as TProps } from 'tippy.js';
import { transparentize } from 'polished';
import { Link } from '../typography/Link';

import * as variables from '../../config/variables';

type Cursor = 'inherit' | 'pointer' | 'help' | 'default';

const Wrapper = styled.div``;

const OpenGuideInner = styled.span`
    float: right;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    transition: all 0.3s ease-in-out;
    width: auto;
    min-width: 61px;
    padding-left: 8px;
    margin-left: 8px;
    height: 20px;
    border-radius: 50%;
    cursor: pointer;
    position: relative;
`;

const BoxDefault = styled(animated.div)<{ $maxWidth: string | number }>`
    padding: 8px;
    background: ${props => props.theme.BG_TOOLTIP};
    color: ${props => props.theme.TYPE_WHITE};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    border-radius: 10px;
    font-size: ${variables.FONT_SIZE.TINY};
    text-align: left;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
    max-width: ${props => props.$maxWidth}px;

    @media all and (min-width: ${variables.SCREEN_SIZE.MD}) {
        &:hover ${OpenGuideInner} {
            border-radius: 26px;
            background-color: ${props => transparentize(0.85, props.theme.TYPE_ORANGE)};
            & > a span:first-child {
                max-width: 100px;
            }
            & > a span:last-child {
                background-color: transparent;
            }
        }
    }
`;

const BoxRich = styled(animated.div)<{ $maxWidth: string | number }>`
    padding: 24px;
    background: ${props => props.theme.BG_WHITE_ALT};
    color: ${props => props.theme.TYPE_DARK_GREY};
    border-radius: 5px;
    font-size: ${variables.FONT_SIZE.NORMAL};
    text-align: left;
    box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.2);
    max-width: ${props => props.$maxWidth}px;
`;

const Content = styled.div<{ dashed?: boolean; cursor: Cursor }>`
    & > * {
        cursor: ${props => props.cursor};
        ${props =>
            props.dashed &&
            `border-bottom: 1.5px dashed ${transparentize(0.66, props.theme.TYPE_LIGHT_GREY)};`}
    }
`;

const ReadMoreLink = styled(Link)`
    padding: 10px 0;
    justify-content: center;
    align-items: center;
    display: flex;
`;

const StyledTooltipTitle = styled.span`
    display: inline-flex;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin-bottom: 8px;
`;

const StyledContent = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-stretch: normal;
    font-style: normal;
    line-height: 1.5;
    letter-spacing: normal;
    text-align: left;
`;

type Props = Omit<TippyProps, 'offset'> & {
    children: ReactNode | JSX.Element | JSX.Element[] | string;
    readMore?: { link: string; text: ReactNode } | null;
    rich?: boolean;
    dashed?: boolean;
    offset?: number;
    cursor?: Cursor;
    openGuide?: { node: React.ReactElement };
    title?: React.ReactElement;
};

const Tooltip = ({
    placement = 'top',
    interactive = true,
    children,
    duration = 150,
    delay = 200,
    animation = true,
    className,
    readMore = null,
    rich = false,
    dashed = false,
    maxWidth = 400,
    offset = 10,
    cursor = 'help',
    content,
    openGuide,
    title,
    ...rest
}: Props) => {
    const config = { tension: 400, friction: 26, mass: 1 };
    const animationStartOffset = 20;
    const getTranslateStyle = () => {
        if (placement === 'top') return `translate(0px, ${animationStartOffset}px)`;
        if (placement === 'bottom') return `translate(0px, -${animationStartOffset}px)`;
        if (placement === 'left') return `translate(${animationStartOffset}px, 0px)`;
        if (placement === 'right') return `translate(-${animationStartOffset}px, 0px)`;
        return '';
    };
    const initialStyles = { opacity: 0, transform: `scale(0.8) ${getTranslateStyle()}` };
    const [spring, setSpring] = useSpring(() => initialStyles);

    const onMount = () => {
        setSpring({
            opacity: 1,
            transform: 'scale(1) translate(0px, 0px)',
            onRest: () => {},
            config,
        });
    };

    const onHide = ({ unmount }: Instance<TProps>) => {
        setSpring({
            ...initialStyles,
            onRest: unmount,
            config: { ...config, clamp: true },
        });
    };

    // set data-test attribute to Tippy https://github.com/atomiks/tippyjs-react/issues/89
    const onCreate = (instance: any) => {
        const content = instance.popper;
        content.setAttribute('data-test', '@tooltip');
    };

    return content && children ? (
        <Wrapper className={className}>
            <Tippy
                zIndex={10070}
                placement={placement}
                animation={animation}
                onMount={onMount}
                onHide={onHide}
                duration={duration}
                delay={delay}
                offset={[0, offset]}
                interactive={interactive}
                appendTo={() => document.body}
                onCreate={onCreate}
                {...rest}
                render={attrs =>
                    rich ? (
                        <BoxRich $maxWidth={maxWidth} tabIndex={-1} style={spring} {...attrs}>
                            {title && <StyledTooltipTitle>{title}</StyledTooltipTitle>}
                            <StyledContent>{content}</StyledContent>
                        </BoxRich>
                    ) : (
                        <BoxDefault $maxWidth={maxWidth} tabIndex={-1} style={spring} {...attrs}>
                            {title && <StyledTooltipTitle>{title}</StyledTooltipTitle>}
                            {openGuide && <OpenGuideInner>{openGuide.node}</OpenGuideInner>}
                            <StyledContent>{content}</StyledContent>
                            {readMore && (
                                <ReadMoreLink
                                    variant="nostyle"
                                    href={readMore.link}
                                    target="_blank"
                                >
                                    {readMore.text}
                                </ReadMoreLink>
                            )}
                        </BoxDefault>
                    )
                }
            >
                <Content dashed={dashed} cursor={cursor}>
                    {children}
                </Content>
            </Tippy>
        </Wrapper>
    ) : (
        <>{children}</>
    );
};

export { Tooltip, TippyProps as TooltipProps };
