import React from 'react';
import styled from 'styled-components';
import { colors } from '@trezor/components';

interface Props {
    children: React.ReactNode;
}

const AbsoluteWrapper = styled.aside`
    width: 254px;
    background: ${colors.WHITE};
    padding-top: 10px;
    margin: 10px 10px 20px 10px;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 6px 14px 0 rgba(0, 0, 0, 0.1);
`;

const Wrapper = styled.div`
    height: 100%;
    display: flex;
`;

export default ({ children }: Props) => {
    return (
        <AbsoluteWrapper>
            <Wrapper>{children}</Wrapper>
        </AbsoluteWrapper>
    );
};
