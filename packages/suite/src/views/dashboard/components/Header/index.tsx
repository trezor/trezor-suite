import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;
    padding-bottom: 25px;
`;

const Left = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.H2};
`;

const Right = styled.div``;

interface Props {
    left: ReactElement;
    right?: ReactElement;
}

const Header = ({ left, right }: Props) => (
    <Wrapper>
        {left && <Left>{left}</Left>}
        {right && <Right>{right}</Right>}
    </Wrapper>
);

export default Header;
