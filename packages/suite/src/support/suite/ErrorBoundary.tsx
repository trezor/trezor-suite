import React from 'react';
import styled from 'styled-components';
import * as Sentry from '@sentry/browser';
import { H1, P, Button } from '@trezor/components-v2';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
`;

const Buttons = styled.div`
    display: flex;
`;

const StyledButton = styled(Button)`
    margin: 12px;
`;

// Cant use hook https://reactjs.org/docs/hooks-faq.html#do-hooks-cover-all-use-cases-for-classes

interface StateProps {
    error: Error | null | undefined;
}

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
                    <P>It appears something is broken. You might let us know by sending report</P>

                    <Buttons>
                        <StyledButton onClick={() => Sentry.showReportDialog()}>
                            Send report
                        </StyledButton>

                        <StyledButton icon="REFRESH" onClick={() => window.location.reload()}>
                            Reload window
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
// import messages from '@suite/support/messages';

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
