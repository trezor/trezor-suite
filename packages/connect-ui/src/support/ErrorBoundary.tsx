import { ReactNode, Component, ErrorInfo } from 'react';

interface StateProps {
    error: Error | null | undefined;
}

interface Props {
    children: ReactNode;
}

export class ErrorBoundary extends Component<Props, StateProps> {
    constructor(props: Props) {
        super(props);
        this.state = { error: null };
    }

    componentDidCatch(error: Error | null, _errorInfo: ErrorInfo) {
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
