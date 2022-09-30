import React from 'react';

interface StateProps {
    error: Error | null | undefined;
}

interface Props {
    children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, StateProps> {
    constructor(props: Props) {
        super(props);
        this.state = { error: null };
    }

    componentDidCatch(error: Error | null, _errorInfo: React.ErrorInfo) {
        this.setState({ error });
    }

    render() {
        return this.state.error ? (
            // render fallback UI
            <>Something went wrong</>
        ) : (
            // when there's not an error, render children untouched
            this.props.children
        );
    }
}
