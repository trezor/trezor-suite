import React from 'react';
import styled from 'styled-components';
import { Tooltip, H1, colors } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 2rem;
`;

const Center = styled.div`
    display: flex;
    justify-content: center;
    padding: 4rem 0px;
`;

storiesOf('Tooltip', module).add(
    'All',
    () => {
        return (
            <Wrapper>
                <H1>Tooltip top</H1>
                <Center data-test="tooltip-top">
                    <Tooltip content="Nehehe" visible>
                        <span>Tooltip text</span>
                    </Tooltip>
                </Center>
                <H1>Tooltip bottom</H1>
                <Center data-test="tooltip-bottom">
                    <Tooltip content="Nehehe" placement="bottom" visible>
                        <span>Tooltip text</span>
                    </Tooltip>
                </Center>
                <H1>Tooltip left</H1>
                <Center data-test="tooltip-left">
                    <Tooltip content="Nehehe" placement="left" visible>
                        <span>Tooltip text</span>
                    </Tooltip>
                </Center>
                <H1>Tooltip right</H1>
                <Center data-test="tooltip-right">
                    <Tooltip content="Nehehe" placement="right" visible>
                        <span>Tooltip text</span>
                    </Tooltip>
                </Center>
            </Wrapper>
        );
    },
    {
        info: {
            disable: true,
        },
    }
);
