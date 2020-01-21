import React from 'react';
import styled from 'styled-components';

import { variables, colors, Switch } from '@trezor/components-v2';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    padding-bottom: 7px;
`;

const Description = styled.div`
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const Left = styled.div`
    padding-right: 5px;
`;

const Right = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    justify-content: flex-end;
`;

const ReplaceByFee = () => {
    return (
        <Wrapper>
            <Left>
                <Title>Replace by fee (RBF)</Title>
                <Description>
                    RBF allows to bump fee later in case you want the transaction to be mined faster
                </Description>
            </Left>
            <Right>
                <Switch checked onChange={() => console.log('change')} />
            </Right>
        </Wrapper>
    );
};

export default ReplaceByFee;
