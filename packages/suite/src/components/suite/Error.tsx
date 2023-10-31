import styled from 'styled-components';
import { H2, Paragraph, Button, variables } from '@trezor/components';
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
    background: ${({ theme }) => theme.STROKE_GREY};
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

const GenericMessage = styled(Paragraph)`
    margin-bottom: 10px;
    text-align: center;
`;

const ErrorMessage = styled.span`
    text-align: center;
    max-width: 600px;
    font-family: Consolas, Menlo, Courier, monospace;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
`;

type ErrorProps = {
    error: string;
};

export const Error = ({ error }: ErrorProps) => (
    <Wrapper>
        <H2>Error occurred</H2>
        <GenericMessage>It appears something is broken.</GenericMessage>
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
