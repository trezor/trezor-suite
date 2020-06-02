import React from 'react';
import styled from 'styled-components';
import * as Sentry from '@sentry/browser';
import { connect } from 'react-redux';
import { AppState } from '@suite/types/suite';
import { H1, P, Button, variables, colors } from '@trezor/components';
import { db } from '@suite/storage';

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

const refresh = () => {
    // @ts-ignore global.ipcRenderer is declared in @desktop/preloader.js
    const { ipcRenderer } = global;
    if (ipcRenderer) {
        // relaunch desktop app
        ipcRenderer.send('restart-app');
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

type Props = ReturnType<typeof mapStateToProps>;

class ErrorBoundary extends React.Component<Props, StateProps> {
    constructor(props: Props) {
        super(props);
        this.state = { error: null };
    }

    componentDidCatch(error: Error | null, errorInfo: object) {
        console.log('instance', this.props.analytics.instanceId);
        console.log('log', JSON.stringify(this.props.log.entries));
        Sentry.withScope(scope => {
            scope.setExtras(errorInfo);
            scope.setExtra('log', this.props.log.entries);
            scope.setUser({ id: this.props.analytics.instanceId });
            // const eventId = Sentry.captureException(error);
            Sentry.captureException(error);
            // this.setState({ eventId });
        });
        this.setState({ error });
        // todo: not in development and in production only if user opts in.
        // Sentry.withScope(scope => {
        //     scope.setExtras(errorInfo);
        // });
    }

    render() {
        const log = JSON.stringify(this.props.log.entries, null, 2);
        if (this.state.error) {
            // render fallback UI
            return (
                <Wrapper>
                    <H1>Error occurred capturing on didcatch</H1>
                    <P textAlign="center">
                        It appears something is broken. You might let us know by sending report
                    </P>
                    <P>{this.state.error.message}</P>
                    {/* <P>{this.state.error.stack}</P> */}

                    <SendReportButton
                        variant="primary"
                        onClick={() => {
                            console.log('log', log);
                            Sentry.configureScope(scope => {
                                scope.setExtra('log', log);
                            });
                        }}
                    >
                        Attach log
                    </SendReportButton>
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
                                await db.clearStores();
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

export default connect(mapStateToProps)(ErrorBoundary);

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
