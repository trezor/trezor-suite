import styled from 'styled-components';
import { Tooltip } from './Tooltip';
import { storiesOf } from '@storybook/react';

const TooltipWrapper = styled.div`
    width: 400px;
    height: 200px;
    text-align: center;
    padding: 5rem 0px;
    margin: 5px;
`;

const RichContentExample = styled.div`
    text-align: left;
`;

storiesOf('Misc/Tooltip', module).add(
    'All',
    () => (
        <>
            <TooltipWrapper data-test="tooltip-top">
                <Tooltip content="Tooltip text">
                    <span>Tooltip top</span>
                </Tooltip>
            </TooltipWrapper>
            <TooltipWrapper data-test="tooltip-bottom">
                <Tooltip content="Tooltip text" placement="bottom">
                    <span>Tooltip bottom</span>
                </Tooltip>
            </TooltipWrapper>
            <TooltipWrapper data-test="tooltip-left">
                <Tooltip content="Tooltip text" placement="left">
                    <span>Tooltip left</span>
                </Tooltip>
            </TooltipWrapper>
            <TooltipWrapper data-test="tooltip-right">
                <Tooltip content="Tooltip text" placement="right">
                    <span>Tooltip right</span>
                </Tooltip>
            </TooltipWrapper>
            <TooltipWrapper data-test="tooltip-rich">
                <Tooltip
                    rich
                    content={
                        <RichContentExample>
                            <h1>Rich content example</h1>
                            <p>
                                Simply dummy text of the printing and typesetting industry. Lorem
                                Ipsum has been the industry's standard dummy
                            </p>
                            <p>
                                Some more text blah blah blah blah blah blah blah blah blah blah
                                blah blah blah blah blah blah blah blah blah
                            </p>
                        </RichContentExample>
                    }
                >
                    <span>Tooltip wth rich content</span>
                </Tooltip>
            </TooltipWrapper>
        </>
    ),
    {
        options: {
            showPanel: false,
        },
    },
);
