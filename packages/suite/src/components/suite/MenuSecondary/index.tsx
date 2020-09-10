import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';

interface Props {
    children: React.ReactNode;
}

const AbsoluteWrapper = styled.aside`
    width: 300px;
    background: ${colors.WHITE};
    border-right: 1px solid ${colors.NEUE_STROKE_GREY};
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
