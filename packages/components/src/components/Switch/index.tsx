import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactSwitch, { ReactSwitchProps } from 'react-switch';
import colors from '@c/config/colors';

interface Props extends ReactSwitchProps {
    onChange: (checked: boolean) => any;
    disabled?: boolean;
    isSmall?: boolean;
}

interface StateProps {
    checked: boolean;
}

class Switch extends Component<Props, StateProps> {
    static propTypes = {
        onChange: PropTypes.func.isRequired,
        disabled: PropTypes.bool,
        isSmall: PropTypes.bool,
    };

    constructor(props: Props) {
        super(props);
        this.state = { checked: false };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(checked: boolean) {
        const shouldUpdateState = this.props.onChange(checked);
        if (shouldUpdateState !== false) {
            this.setState({ checked });
        }
    }

    render() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { onChange, disabled, isSmall, ...rest }: Props = this.props;
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

export default Switch;
