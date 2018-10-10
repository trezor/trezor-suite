import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import RedBox from 'redbox-react';

class ErrorBoundary extends PureComponent {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: false };
    }

    componentDidCatch(error) {
        this.setState({ hasError: true, error });
    }

    render() {
        if (this.state.hasError) {
            return <RedBox error={this.state.error} />;
        }
        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node,
};

export default ErrorBoundary;