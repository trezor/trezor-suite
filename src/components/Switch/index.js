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
        if (shouldUpdateState !== false) {
            this.setState({ checked });
        }
    }

    render() {
        const { onChange, disabled, isSmall, ...rest } = this.props;
        const smallProps = isSmall
            ? {
                  width: 36,
                  height: 18,
                  handleDiameter: 14,
              }
            : {};
        return (
            <ReactSwitch
                checked={this.state.checked}
                disabled={disabled}
                onChange={this.handleChange}
                onColor={colors.GREEN_PRIMARY}
                {...smallProps}
                {...rest}
            />
        );
    }
}
Switch.propTypes = {
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
    isSmall: PropTypes.bool,
};

export default Switch;
