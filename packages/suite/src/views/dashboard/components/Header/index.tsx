import React, { ReactElement } from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    justify-content: space-between;
    padding-bottom: 25px;
`;

const Left = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.NEUE_FONT_SIZE.H2};
`;

const Right = styled.div``;

interface Props {
    left: ReactElement;
    right?: ReactElement;
}

export default ({ left, right }: Props) => (
    <Wrapper>
        {left && <Left>{left}</Left>}
        {right && <Right>{right}</Right>}
    </Wrapper>
);
