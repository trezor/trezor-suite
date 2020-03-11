import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';

import { variables, colors, Switch } from '@trezor/components';

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

export default () => {
    return (
        <Wrapper>
            <Left>
                <Title>
                    <Translation id="REPLACE_BY_FEE_TITLE" />
                </Title>
                <Description>
                    <Translation id="REPLACE_BY_FEE_DESCRIPTION" />
                </Description>
            </Left>
            <Right>
                <Switch checked={false} onChange={() => console.log('change')} />
            </Right>
        </Wrapper>
    );
};
