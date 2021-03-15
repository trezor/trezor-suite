import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { Icon, variables } from '@trezor/components';
import { animated, useSpring } from 'react-spring';
import { useMeasure } from 'react-use';

const Wrapper = styled.div<Pick<Props, 'variant'>>`
    display: flex;
    flex-direction: column;
    background: ${props => props.theme.BG_GREY};
    margin-bottom: 20px;

    ${props =>
        props.variant === 'small' &&
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

const Header = styled.div<Pick<Props, 'variant'>>`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: ${props => (props.variant === 'large' ? '24px 30px' : '12px 16px')};
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
`;
const IconLabel = styled.div`
    margin-right: 6px;
    margin-left: 28px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Heading = styled.span`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Content = styled(animated.div)<Pick<Props, 'noContentPadding' | 'variant'>>`
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};

    ${props =>
        !props.noContentPadding &&
        css`
            padding: 20px ${props.variant === 'large' ? '30px' : '16px'};
        `}
`;

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
    heading: React.ReactNode;
    variant: 'small' | 'large';
    iconLabel?: React.ReactNode;
    children?: React.ReactNode;
    noContentPadding?: boolean;
}

const CollapsibleBox = ({
    heading,
    iconLabel,
    children,
    noContentPadding,
    variant = 'small',
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
                onClick={() => {
                    setCollapsed(!collapsed);
                    setAnimatedIcon(true);
                }}
            >
                <Heading>{heading ?? iconLabel}</Heading>
                <IconWrapper>
                    {heading && <IconLabel>{iconLabel}</IconLabel>}
                    <Icon
                        icon="ARROW_DOWN"
                        size={20}
                        canAnimate={animatedIcon}
                        isActive={!collapsed}
                    />
                </IconWrapper>
            </Header>
            <animated.div style={{ ...slideInStyles, overflow: 'hidden' }}>
                <animated.div ref={heightRef} style={{ overflow: 'hidden' }}>
                    <Content variant={variant} noContentPadding={noContentPadding}>
                        {children}
                    </Content>
                </animated.div>
            </animated.div>
        </Wrapper>
    );
};

export default CollapsibleBox;
