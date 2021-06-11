import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { transparentize } from 'polished';

const Wrapper = styled.div<{ shadowActive: boolean }>`
    height: 100%;
    overflow-y: auto;
    padding: 15px 22px 0;

    box-shadow: none;
    border-top: 1px solid transparent;
    transition: all 0.5s ease;
    ${props =>
        props.shadowActive &&
        css`
            box-shadow: inset 0 27px 27px -27px ${props => transparentize(0.5, props.theme.STROKE_GREY)};
            border-top: 1px solid ${props => props.theme.STROKE_GREY};
        `}
`;

interface Props {
    children: React.ReactNode;
}

const Content = ({ ...props }: Props) => {
    const [shadowActive, setShadowActive] = useState<boolean>(false);

    const onScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
        if (e?.currentTarget?.scrollTop) {
            setShadowActive(true);
        } else {
            setShadowActive(false);
        }
    };

    return <Wrapper onScroll={onScroll} shadowActive={shadowActive} {...props} />;
};

export default Content;
