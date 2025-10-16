import styled from 'styled-components';

import { H2, NewButton, Paragraph, variables } from '@trezor/components';

import { db } from 'src/storage';
import { reloadApp } from 'src/utils/suite/reload';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
    padding: 20px;
`;

const Buttons = styled.div`
    display: flex;
    justify-content: space-between;
    width: 60%;
    min-width: 320px;
    max-width: 500px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 80%;
    }
`;

const Separator = styled.div`
    background: ${({ theme }) => theme.legacy.STROKE_GREY};
    height: 1px;
    margin: 30px 0;
    width: 80%;
    min-width: 320px;
    max-width: 800px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 90%;
    }
`;

const ErrorMessage = styled.span`
    text-align: center;
    max-width: 600px;
    font-family: Consolas, Menlo, Courier, monospace;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
`;

type ErrorProps = {
    error: string;
};

export const Error = ({ error }: ErrorProps) => (
    <Wrapper>
        <H2>Error occurred</H2>
        <Paragraph margin={{ bottom: 8 }} align="center">
            It appears something is broken.
        </Paragraph>
        <ErrorMessage>{error}</ErrorMessage>
        <Separator />
        <Buttons>
            <NewButton
                iconLeft="repeat"
                intent="neutral"
                priority="secondary"
                onClick={() => {
                    reloadApp();
                }}
                margin={{ vertical: 6, horizontal: 12 }}
            >
                Reload window
            </NewButton>

            <NewButton
                iconLeft="repeat"
                intent="neutral"
                priority="secondary"
                onClick={() => {
                    db.removeDatabase();
                    reloadApp();
                }}
                margin={{ vertical: 6, horizontal: 12 }}
            >
                Clear storage and reload
            </NewButton>
        </Buttons>
    </Wrapper>
);
