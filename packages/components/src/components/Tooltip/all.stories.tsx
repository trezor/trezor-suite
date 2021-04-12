import React from 'react';
import styled from 'styled-components';
import { Tooltip } from './index';
import { storiesOf } from '@storybook/react';

const TooltipWrapper = styled.div`
    width: 400px;
    height: 200px;
    text-align: center;
    padding: 5rem 0px;
    margin: 5px;
`;

storiesOf('Tooltip', module).add(
    'All',
    () => (
        <>
            <TooltipWrapper data-test="tooltip-top">
                <Tooltip content="Tooltip text" visible>
                    <span>Tooltip top</span>
                </Tooltip>
            </TooltipWrapper>
            <TooltipWrapper data-test="tooltip-bottom">
                <Tooltip content="Tooltip text" visible placement="bottom">
                    <span>Tooltip bottom</span>
                </Tooltip>
            </TooltipWrapper>
            <TooltipWrapper data-test="tooltip-left">
                <Tooltip content="Tooltip text" visible placement="left">
                    <span>Tooltip left</span>
                </Tooltip>
            </TooltipWrapper>
            <TooltipWrapper data-test="tooltip-right">
                <Tooltip content="Tooltip text" visible placement="right">
                    <span>Tooltip right</span>
                </Tooltip>
            </TooltipWrapper>
            <TooltipWrapper data-test="tooltip-top">
                <Tooltip
                    content="Simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy"
                    visible
                    readMore={{ link: 'https://www.trezor.io', text: 'Read more' }}
                >
                    <span>Tooltip wth read more link</span>
                </Tooltip>
            </TooltipWrapper>
        </>
    ),
    {
        options: {
            showPanel: false,
        },
    }
);
