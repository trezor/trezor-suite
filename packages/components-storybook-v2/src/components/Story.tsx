import React from 'react';
import randomColor from 'randomcolor';
import styled from 'styled-components';

const color = randomColor({ luminosity: 'light' });

const Wrapper = styled.div`
    padding: 20px;
    display: flex;
    height: 100%;
    flex-wrap: wrap;
`;

interface StoryWrapperProps {
    children: any;
}

const StoryWrapper = ({ children }: StoryWrapperProps) => <Wrapper>{children}</Wrapper>;

interface StoryColumnProps {
    children: any;
    maxWidth?: string;
    minWidth?: string;
}

const Col = styled.div<StoryColumnProps>`
    padding: 10px;
    flex: 1;
    border-radius: 10px;
    border: 1px dashed ${color};
    margin: 5px;
    min-width: ${props => props.minWidth};
    max-width: ${props => props.minWidth};

    > * {
        margin-bottom: 20px;
    }
`;

const StoryColumn = ({ minWidth, maxWidth, children }: StoryColumnProps) => (
    <Col minWidth={`${minWidth}px` || '200px'} maxWidth={`${maxWidth}px` || '350px'}>
        {children}
    </Col>
);

export { StoryWrapper, StoryColumn };
