import React from 'react';
import styled from 'styled-components';

interface Props {
    children: React.ReactNode;
}

const AbsoluteWrapper = styled.aside`
    width: 300px;
    flex: 0 0 auto;
    background: ${props => props.theme.BG_WHITE};
    border-right: 1px solid ${props => props.theme.STROKE_GREY};
    overflow: hidden;
`;

const Wrapper = styled.div`
    height: 100%;
    display: flex;
`;

const MenuSecondary = ({ children }: Props) => {
    return (
        <AbsoluteWrapper>
            <Wrapper>{children}</Wrapper>
        </AbsoluteWrapper>
    );
};

export default MenuSecondary;
