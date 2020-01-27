import React from 'react';
import styled from 'styled-components';
import { Tooltip } from '@trezor/components-v2';
import { storiesOf } from '@storybook/react';
import { StoryColumn } from '../../components/Story';

const Center = styled.div`
    display: flex;
    justify-content: center;
`;

const TooltipWrapper = styled.div`
    width: 400px;
    text-align: center;
    padding: 5rem 0px;
    margin: 5px;
`;

storiesOf('Tooltip', module).add(
    'All',
    () => {
        return (
            <>
                <StoryColumn>
                    <TooltipWrapper data-test="tooltip-top">
                        <Tooltip content="Tooltip text" visible>
                            <span>Tooltip top</span>
                        </Tooltip>
                    </TooltipWrapper>
                </StoryColumn>
                <StoryColumn>
                    <TooltipWrapper data-test="tooltip-bottom">
                        <Tooltip content="Tooltip text" visible placement="bottom">
                            <span>Tooltip bottom</span>
                        </Tooltip>
                    </TooltipWrapper>
                </StoryColumn>
                <StoryColumn>
                    <TooltipWrapper data-test="tooltip-left">
                        <Tooltip content="Tooltip text" visible placement="left">
                            <span>Tooltip left</span>
                        </Tooltip>
                    </TooltipWrapper>
                </StoryColumn>
                <StoryColumn>
                    <TooltipWrapper data-test="tooltip-right">
                        <Tooltip content="Tooltip text" visible placement="right">
                            <span>Tooltip right</span>
                        </Tooltip>
                    </TooltipWrapper>
                </StoryColumn>
            </>
        );
    },
    {
        options: {
            showPanel: false,
        },
    }
);
