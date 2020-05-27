import React from 'react';
import styled from 'styled-components';
import * as Sentry from '@sentry/browser';
import { H1, P, Button } from '@trezor/components';
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
    flex-direction: column;
`;

const Separator = styled.div`
    background: #dddddd;
    height: 1px;
    margin: 12px 0px;
    max-width: 80%;
`;
const SendReportButton = styled(Button)`
    margin-top: 12px;
`;

const StyledButton = styled(Button)`
    margin: 6px 12px;
`;

// Cant use hook https://reactjs.org/docs/hooks-faq.html#do-hooks-cover-all-use-cases-for-classes

interface StateProps {
    error: Error | null | undefined;
}

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

class ErrorBoundary extends React.Component<{}, StateProps> {
    constructor(props: {}) {
        super(props);
        this.state = { error: null };
    }

    componentDidCatch(error: Error | null, _errorInfo: object) {
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
                    <P textAlign="center">
                        It appears something is broken. You might let us know by sending report
                    </P>
                    <P>{this.state.error.message}</P>
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

export default ErrorBoundary;

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
