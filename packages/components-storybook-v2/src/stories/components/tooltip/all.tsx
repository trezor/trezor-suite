import React from 'react';
import styled from 'styled-components';
import { Tooltip, H2 } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';

const Wrapper = styled.div`
    padding: 2rem;
`;

const Center = styled.div`
    display: flex;
    justify-content: center;
`;

const TooltipWrapper = styled.div`
    width: 400px;
    text-align: center;
    padding: 5rem 0px;
`;

storiesOf('Tooltip', module).add(
    'All',
    () => {
        return (
            <Wrapper>
                <H2>Top</H2>
                <Center>
                    <TooltipWrapper data-test="tooltip-top">
                        <Tooltip content="Tooltip text" visible>
                            <span>Tooltip top</span>
                        </Tooltip>
                    </TooltipWrapper>
                </Center>
                <H2>Bottom</H2>
                <Center>
                    <TooltipWrapper data-test="tooltip-bottom">
                        <Tooltip content="Tooltip text" visible placement="bottom">
                            <span>Tooltip bottom</span>
                        </Tooltip>
                    </TooltipWrapper>
                </Center>
                <H2>Left</H2>
                <Center>
                    <TooltipWrapper data-test="tooltip-left">
                        <Tooltip content="Tooltip text" visible placement="left">
                            <span>Tooltip left</span>
                        </Tooltip>
                    </TooltipWrapper>
                </Center>
                <H2>Right</H2>
                <Center>
                    <TooltipWrapper data-test="tooltip-right">
                        <Tooltip content="Tooltip text" visible placement="right">
                            <span>Tooltip right</span>
                        </Tooltip>
                    </TooltipWrapper>
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
