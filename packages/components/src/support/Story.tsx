import React from 'react';
import randomColor from 'randomcolor';
import styled, { ThemeProvider } from 'styled-components';
import { THEME, P } from '../index';

const color = randomColor({ luminosity: 'light' });

const Wrapper = styled.div`
    padding: 20px;
    display: flex;
    height: 100%;
    flex-wrap: wrap;
    background: ${props => props.theme.BG_WHITE};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const StoryWrapper = (story: any) => (
    <>
        <P size="normal">Light theme</P>
        <ThemeProvider theme={THEME.light}>
            <Wrapper>{story.children}</Wrapper>
        </ThemeProvider>

        <P size="normal">Dark theme</P>
        <ThemeProvider theme={THEME.dark}>
            <Wrapper>{story.children}</Wrapper>
        </ThemeProvider>
    </>
);

interface StoryColumnProps {
    children: any;
    maxWidth?: number;
    minWidth?: number;
}

const Col = styled.div<StoryColumnProps>`
    padding: 10px;
    flex: 1;
    border-radius: 10px;
    border: 1px dashed ${color};
    margin: 5px;
    min-width: ${props => props.minWidth}px;
    max-width: ${props => props.maxWidth}px;

    > * {
        margin-bottom: 20px;
    }
`;

const StoryColumn = ({ minWidth, maxWidth, children }: StoryColumnProps) => (
    <Col minWidth={minWidth || 250} maxWidth={maxWidth || 500}>
        {children}
    </Col>
);

export { StoryWrapper, StoryColumn };
