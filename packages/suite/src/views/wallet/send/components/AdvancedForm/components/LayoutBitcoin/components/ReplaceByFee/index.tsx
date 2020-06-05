import { Translation } from '@suite-components/Translation';
import { colors, Switch, Tooltip, variables } from '@trezor/components';
import React from 'react';
import styled from 'styled-components';

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
                <Tooltip placement="top" content={<Translation id="TR_SEND_COMING_SOON" />}>
                    <Switch checked={false} onChange={() => {}} />
                </Tooltip>
            </Right>
        </Wrapper>
    );
};
