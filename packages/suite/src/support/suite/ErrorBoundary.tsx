import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { reportToSentry } from '@suite-actions/logActions';
import { Error } from '@suite-components/Error';

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
        return this.state.error ? (
            // render fallback UI
            <Error error={this.state.error.message} />
        ) : (
            // when there's not an error, render children untouched
            this.props.children
        );
    }
}

export default connect(null, mapDispatchToProps)(ErrorBoundary);
