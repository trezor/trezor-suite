import React from 'react';
import styled from 'styled-components';
import * as Sentry from '@sentry/browser';
import { connect } from 'react-redux';
import { AppState } from '@suite/types/suite';
import { H1, P, Button, variables, colors } from '@trezor/components';
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
    background: ${colors.BLACK80};
    height: 1px;
    margin: 30px 0px;
    width: 80%;
    min-width: 320px;
    max-width: 800px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 90%;
    }
`;

const SendReportButton = styled(Button)`
    margin-top: 30px;
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
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const refresh = () => {
    if (window.desktopApi) {
        // relaunch desktop app
        window.desktopApi.send('app/restart');
    } else {
        window.location.reload();
    }
};

// Cant use hook https://reactjs.org/docs/hooks-faq.html#do-hooks-cover-all-use-cases-for-classes

interface StateProps {
    error: Error | null | undefined;
    // eventId: string | undefined;
}

const mapStateToProps = (state: AppState) => ({
    log: state.log,
    analytics: state.analytics,
});

const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators({ reportToSentry }, dispatch);

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

/**
 * Swallow render errors an display feedback form
 * Read more: https://reactjs.org/docs/error-boundaries.html
 * This component cannot be written as a `React.FunctionalComponent`
 * because of the absence of hook equivalent for `componentDidCatch`
 * see: https://reactjs.org/docs/hooks-faq.html#do-hooks-cover-all-use-cases-for-classes
 */

class ErrorBoundary extends React.Component<Props, StateProps> {
    constructor(props: Props) {
        super(props);
        this.state = { error: null };
    }

    componentDidCatch(error: Error | null, _errorInfo: object) {
        this.props.reportToSentry(error, this.props.analytics.enabled);
        this.setState({ error });
        // todo: not in development and in production only if user opts in.
        // Sentry.withScope(scope => {
        //     scope.setExtras(errorInfo);
        // });
    }

    render() {
        if (this.state.error) {
            // render fallback UI
            return (
                <Wrapper>
                    <H1>Error occurred</H1>
                    <GenericMessage textAlign="center">
                        It appears something is broken. You might let us know by sending report
                    </GenericMessage>
                    <ErrorMessage>{this.state.error.message}</ErrorMessage>
                    {/* <P>{this.state.error.stack}</P> */}

                    <SendReportButton variant="primary" onClick={() => Sentry.showReportDialog()}>
                        Send report
                    </SendReportButton>
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
                            onClick={async () => {
                                await db.removeDatabase();
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

export default connect(mapStateToProps, mapDispatchToProps)(ErrorBoundary);

// In case we would like to translate these. Not possible now, ErrorBoundary is not nested in
// IntlProvider. Not sure if we need so much to have this translated here.

// import { Translation } from '@suite-components/Translation';
//

// TR_ERROR_OCCURRED: {
//     id: 'TR_ERROR_OCCURRED',
//     defaultMessage: 'Error occurred',
// },
// TR_IT_APPEARS_SOMETHING_IS_BROKEN: {
//     id: 'TR_IT_APPEARS_SOMETHING_IS_BROKEN',
//     defaultMessage: 'It appears something is broken. You might let us know by sending report',
// },
// TR_SEND_REPORT: {
//     id: 'TR_SEND_REPORT',
//     defaultMessage: 'Send report',
// },
// TR_RELOAD_WINDOW: {
//     id: 'TR_RELOAD_WINDOW',
//     defaultMessage: 'Reload window',
// },
