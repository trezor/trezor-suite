import React from 'react';
import styled from 'styled-components';
import { colors, variables, H2 } from '@trezor/components';

const Content = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 520px;
`;

const Title = styled(H2)`
    display: flex;
    text-align: center;
    color: ${colors.BLACK0};
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    width: 100%;
`;

const Description = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    text-align: center;
    color: ${colors.BLACK50};
    margin-bottom: 10px;
`;

interface Props {
    title: JSX.Element | string;
    description?: JSX.Element | string;
    image?: JSX.Element;
    children?: React.ReactNode;
}

const Wrapper = (props: Props) => {
    return (
        <Content>
            <Title>{props.title}</Title>
            {props.description && <Description>{props.description}</Description>}
            {props.image && props.image}
            {props.children && <Actions>{props.children}</Actions>}
        </Content>
    );
};

export default Wrapper;
