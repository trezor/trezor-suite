import React from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { desktopApi } from '@trezor/suite-desktop-api';
import { H1, P, Button, variables } from '@trezor/components';
import { db } from '@suite/storage';
import { bindActionCreators, Dispatch } from 'redux';
import { reportToSentry } from '@suite-actions/logActions';

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

const refresh = () => {
    if (desktopApi.available) {
        desktopApi.appRestart();
    } else if (typeof window !== 'undefined') {
        window.location.reload();
    }
};

interface StateProps {
    error: Error | null | undefined;
}

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({ reportToSentry }, dispatch);

type Props = ReturnType<typeof mapDispatchToProps> & {
    children: JSX.Element[];
};

/**
 * Swallow render errors
 * Read more: https://reactjs.org/docs/error-boundaries.html
 *
 * This component cannot be written as a `React.FunctionalComponent`
 * because of the absence of hook equivalent for `componentDidCatch`
 * see: https://reactjs.org/docs/hooks-faq.html#do-hooks-cover-all-use-cases-for-classes
 *
 *  It's not translatable, because ErrorBoundary is not nested in IntlProvider.
 */
class ErrorBoundary extends React.Component<Props, StateProps> {
    constructor(props: Props) {
        super(props);
        this.state = { error: null };
    }

    componentDidCatch(error: Error | null, _errorInfo: React.ErrorInfo) {
        this.props.reportToSentry(error);
        this.setState({ error });
    }

    render() {
        if (this.state.error) {
            // render fallback UI
            return (
                <Wrapper>
                    <H1>Error occurred</H1>
                    <GenericMessage textAlign="center">
                        It appears something is broken.
                    </GenericMessage>
                    <ErrorMessage>{this.state.error.message}</ErrorMessage>
                    <Separator />
                    <Buttons>
                        <StyledButton
                            icon="REFRESH"
                            variant="tertiary"
                            onClick={() => {
                                refresh();
                            }}
                        >
                            Reload window
                        </StyledButton>

                        <StyledButton
                            icon="REFRESH"
                            variant="tertiary"
                            onClick={() => {
                                db.removeDatabase();
                                refresh();
                            }}
                        >
                            Clear storage and reload
                        </StyledButton>
                    </Buttons>
                </Wrapper>
            );
        }

        // when there's not an error, render children untouched
        return this.props.children;
    }
}

export default connect(null, mapDispatchToProps)(ErrorBoundary);
