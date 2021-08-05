import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { animated, useSpring } from 'react-spring';
import useMeasure from 'react-use/lib/useMeasure';

import { Icon, variables } from '@trezor/components';

const Wrapper = styled.div<Pick<Props, 'variant'>>`
    display: flex;
    flex-direction: column;
    background: ${props => props.theme.BG_GREY};
    margin-bottom: 20px;

    ${props =>
        (props.variant === 'tiny' || props.variant === 'small') &&
        css`
            border-radius: 4px;
        `}
    ${props =>
        props.variant === 'large' &&
        css`
            border-radius: 16px;
            box-shadow: 0 2px 5px 0 ${props.theme.BOX_SHADOW_BLACK_20};
        `}
`;

const Header = styled.div<Pick<Props, 'variant' | 'headerJustifyContent'>>`
    display: flex;
    width: 100%;
    justify-content: ${props => props.headerJustifyContent};
    align-items: center;
    cursor: pointer;

    ${props =>
        props.variant === 'tiny' &&
        css`
            padding: 8px 16px;
        `}
    ${props =>
        props.variant === 'small' &&
        css`
            padding: 12px 16px;
        `}
    ${props =>
        props.variant === 'large' &&
        css`
            padding: 24px 30px;
        `}
`;

const IconWrapper = styled.div<Pick<Props, 'headerJustifyContent'>>`
    display: flex;
    align-items: center;
    ${props =>
        props.headerJustifyContent === 'center' &&
        css`
            padding-left: 2px;
        `}
`;

const IconLabel = styled.div`
    margin-right: 6px;
    margin-left: 28px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Heading = styled.span<Pick<Props, 'variant'>>`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    ${props =>
        props.variant === 'tiny' &&
        css`
            font-size: ${variables.NEUE_FONT_SIZE.NANO};
        `}

    ${props =>
        (props.variant === 'small' || props.variant === 'large') &&
        css`
            font-size: ${variables.NEUE_FONT_SIZE.SMALL};
        `}
`;

const Content = styled(animated.div)<{ variant: Props['variant']; $noContentPadding?: boolean }>`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};

    ${props =>
        !props.$noContentPadding &&
        props.variant === 'tiny' &&
        css`
            padding: 15px 16px;
        `}

    ${props =>
        !props.$noContentPadding &&
        props.variant === 'small' &&
        css`
            padding: 20px 16px;
        `}

    ${props =>
        !props.$noContentPadding &&
        props.variant === 'large' &&
        css`
            padding: 20px 30px;
        `}
`;

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
    heading: React.ReactNode;
    variant: 'tiny' | 'small' | 'large';
    iconLabel?: React.ReactNode;
    children?: React.ReactNode;
    noContentPadding?: boolean;
    headerJustifyContent?: 'space-between' | 'center';
}

const CollapsibleBox = ({
    heading,
    iconLabel,
    children,
    noContentPadding,
    variant = 'small',
    headerJustifyContent = 'space-between',
    ...rest
}: Props) => {
    const [collapsed, setCollapsed] = useState(true);
    const [animatedIcon, setAnimatedIcon] = useState(false);
    const [heightRef, { height }] = useMeasure<HTMLDivElement>();

    const slideInStyles = useSpring({
        from: { opacity: 0, height: 0 },
        to: {
            opacity: !collapsed ? 1 : 0,
            height: !collapsed ? height : 0,
        },
    });

    return (
        <Wrapper variant={variant} {...rest}>
            <Header
                variant={variant}
                headerJustifyContent={headerJustifyContent}
                onClick={() => {
                    setCollapsed(!collapsed);
                    setAnimatedIcon(true);
                }}
            >
                <Heading variant={variant}>{heading ?? iconLabel}</Heading>
                <IconWrapper headerJustifyContent={headerJustifyContent}>
                    {heading && iconLabel && <IconLabel>{iconLabel}</IconLabel>}
                    <Icon
                        icon="ARROW_DOWN"
                        size={variant === 'tiny' ? 12 : 20}
                        canAnimate={animatedIcon}
                        isActive={!collapsed}
                    />
                </IconWrapper>
            </Header>
            <animated.div style={{ ...slideInStyles, overflow: 'hidden' }}>
                <animated.div ref={heightRef} style={{ overflow: 'hidden' }}>
                    <Content variant={variant} $noContentPadding={noContentPadding}>
                        {children}
                    </Content>
                </animated.div>
            </animated.div>
        </Wrapper>
    );
};

export default CollapsibleBox;
