import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactSwitch from 'react-switch';
import colors from 'config/colors';

class Switch extends Component {
    constructor() {
        super();
        this.state = { checked: false };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(checked) {
        const shouldUpdateState = this.props.onChange(checked);
        if (shouldUpdateState) {
            this.setState({ checked });
        }
    }

    render() {
        console.log(this.state.checked);
        const { onChange, disabled, ...rest } = this.props;
        return (
            <ReactSwitch
                disabled={disabled}
                onChange={this.handleChange}
                onColor={colors.GREEN_PRIMARY}
                {...rest}
            />
        );
    }
}
Switch.propTypes = {
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};

export default Switch;
