import styled, { ThemeProvider } from 'styled-components';
import { intermediaryTheme } from '../index';

const Wrapper = styled.div`
    padding: 20px;
    display: flex;
    height: 100%;
    flex-wrap: wrap;
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    color: ${({ theme }) => theme.textDefault};
`;

const StoryWrapper = (story: any) => (
    <>
        <ThemeProvider theme={intermediaryTheme.light}>
            <Wrapper>{story.children}</Wrapper>
        </ThemeProvider>

        <ThemeProvider theme={intermediaryTheme.dark}>
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
    border: 1px dashed #f2ae7b;
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
