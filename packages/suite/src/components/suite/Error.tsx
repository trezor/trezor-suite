import React from 'react';
import styled from 'styled-components';
import { H1, P, Button, variables } from '@trezor/components';
import { db } from '@suite/storage';
import { reloadApp } from '@suite-utils/reload';

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
    background: ${props => props.theme.STROKE_GREY};
    height: 1px;
    margin: 30px 0px;
    width: 80%;
    min-width: 320px;
    max-width: 800px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 90%;
    }
`;

const StyledButton = styled(Button)`
    margin: 6px 12px;
`;

const GenericMessage = styled(P)`
    margin-bottom: 10px;
`;

const ErrorMessage = styled.span`
    text-align: center;
    max-width: 600px;
    font-family: Consolas, Menlo, Courier, monospace;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

type ErrorProps = {
    error: string;
};

export const Error = ({ error }: ErrorProps) => (
    <Wrapper>
        <H1>Error occurred</H1>
        <GenericMessage textAlign="center">It appears something is broken.</GenericMessage>
        <ErrorMessage>{error}</ErrorMessage>
        <Separator />
        <Buttons>
            <StyledButton
                icon="REFRESH"
                variant="tertiary"
                onClick={() => {
                    reloadApp();
                }}
            >
                Reload window
            </StyledButton>

            <StyledButton
                icon="REFRESH"
                variant="tertiary"
                onClick={() => {
                    db.removeDatabase();
                    reloadApp();
                }}
            >
                Clear storage and reload
            </StyledButton>
        </Buttons>
    </Wrapper>
);
