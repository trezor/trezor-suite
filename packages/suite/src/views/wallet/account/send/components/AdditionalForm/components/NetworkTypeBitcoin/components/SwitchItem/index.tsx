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

const Left = styled.div``;

const Right = styled.div`
    display: flex;
    align-items: center;
    flex: 1;
    padding-left: 5px;
`;

interface Props {
    title: string;
    description: string;
}

const SwitchItem = ({ title, description, action }: Props) => {
    return (
        <Wrapper>
            <Left>
                <Title>{title}</Title>
                <Description>{description}</Description>
            </Left>
            <Right>
                <Switch checked onChange={action} />
            </Right>
        </Wrapper>
    );
};

export default SwitchItem;
