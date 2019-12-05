import React from 'react';
import styled from 'styled-components';
import { H1, P, Button } from '@trezor/components-v2';

import * as Sentry from '@sentry/browser';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
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
                    {/* Sentry.showReportDialog({ eventId: this.state.eventId }) */}
                    <StyledButton onClick={() => Sentry.showReportDialog()}>
                        Send report
                    </StyledButton>
                </Wrapper>
            );
        }

        // when there's not an error, render children untouched
        return this.props.children;
    }
}

export default ErrorBoundary;
