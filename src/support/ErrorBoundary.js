import React, { Component } from 'react';
import RedBox from 'redbox-react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: false };
    }

    componentDidCatch(error, info) {
        this.setState({ hasError: true, error });
    }

    render() {
        if (this.state.hasError) {
            return <RedBox error={this.state.error} />;
        }
        return this.props.children;
    }
}

export default ErrorBoundary;