import React, { ComponentProps, Fragment } from 'react';

import styled, { ThemeProvider } from 'styled-components';

import { intermediaryTheme } from '../index';

const Wrapper = styled.div`
    padding: 20px;
    display: flex;
    height: 100%;
    flex-wrap: wrap;
    background: ${({ theme }) => theme.backgroundSurfaceElevation0};
    color: ${({ theme }) => theme.textDefault};
`;

export const StoryWrapper = (story: any) =>
    React.createElement(
        Fragment,
        null,
        React.createElement(
            ThemeProvider,
            { theme: { ...intermediaryTheme.light, variant: 'light' } },
            React.createElement(Wrapper, null, story.children),
        ),
        React.createElement(
            ThemeProvider,
            { theme: { ...intermediaryTheme.dark, variant: 'dark' } },
            React.createElement(Wrapper, null, story.children),
        ),
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
    border: 1px dashed #f2ae7b;
    margin: 5px;
    min-width: ${props => props.minWidth}px;
    max-width: ${props => props.maxWidth}px;

    > * {
        margin-bottom: 20px;
    }
`;

export const StoryColumn = ({ minWidth, maxWidth, children }: StoryColumnProps) =>
    React.createElement<Omit<ComponentProps<typeof Col>, 'children'>>(
        Col,
        { minWidth: minWidth || 250, maxWidth: maxWidth || 500 },
        children,
    );
