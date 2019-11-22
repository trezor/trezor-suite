import React from 'react';
import styled, { css } from 'styled-components';
import { Props as ContainerProps } from '../../Container';

const Wrapper = styled.div`
    background: #2b2b2b; /* TODO: fetch from components */
    display: flex;
    margin-top: 5px;
`;

interface ComponentProps {
    isActive: boolean;
}

const In = styled.div<ComponentProps>`
    cursor: pointer;
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
            background: white; /* TODO: fetch from components */
        `}
`;

const InnerWrapper = styled.div<ComponentProps>`
    color: white; /* TODO: fetch from components */
    font-weight: bold; /* TODO: fetch from components */

    ${props =>
        props.isActive &&
        css`
            color: black; /* TODO: fetch from components */
        `}
`;

const Icon = styled(InnerWrapper)<ComponentProps>``;
const Text = styled(InnerWrapper)<ComponentProps>``;

interface Props {
    route: any;
    isActive: boolean;
    text: string;
    goto: ContainerProps['goto'];
}

const Menu = (props: Props) => {
    return (
        <Wrapper>
            <In onClick={() => props.goto(props.route)} isActive={props.isActive}>
                <Icon isActive={props.isActive}>O</Icon>
                <Text isActive={props.isActive}>{props.text}</Text>
            </In>
        </Wrapper>
    );
};

export default Menu;
