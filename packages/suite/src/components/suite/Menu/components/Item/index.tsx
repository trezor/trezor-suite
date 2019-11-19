import React from 'react';
import styled, { css } from 'styled-components';

const Wrapper = styled.div`
    background: #2b2b2b;
    display: flex;
    margin-top: 5px;
`;

type ComponentProps = {
    isActive: boolean;
};

const In = styled.div<ComponentProps>`
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
    display: flex;
    flex: 1;
    margin-left: 10px;
    padding: 20px 0;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    ${props =>
        props.isActive &&
        css`
            background: white;
        `}
`;

const Icon = styled.div<ComponentProps>`
    color: white;
    font-weight: bold;

    ${props =>
        props.isActive &&
        css`
            color: black;
        `}
`;

const Text = styled.div<ComponentProps>`
    color: white;
    font-weight: bold;

    ${props =>
        props.isActive &&
        css`
            color: black;
        `}
`;

interface Props {
    text: string;
    icon: any;
    link: string;
}

const isActive = (link: string) => {
    return link === '/wallet';
};

const Menu = (props: Props) => {
    const active = isActive(props.link);
    return (
        <Wrapper>
            <In isActive={active}>
                <Icon isActive={active}>O</Icon>
                <Text isActive={active}>{props.text}</Text>
            </In>
        </Wrapper>
    );
};

export default Menu;
