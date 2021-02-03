import React from 'react';
import styled from 'styled-components';
import { Card } from '@trezor/components';

const Wrapper = styled(Card)`
    display: flex;
    flex-direction: column;
    text-align: left;
    background-color: ${props => props.theme.BG_GREY};
    margin-left: -10px;
    margin-right: -10px;
    margin-top: 12px;
`;

const GreyCard = (props: { children?: React.ReactNode }) => {
    return <Wrapper>{props.children}</Wrapper>;
};

export default GreyCard;
