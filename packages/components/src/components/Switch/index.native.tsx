import React, { Component } from 'react';
import { Switch as SwitchNative, SwitchProps } from 'react-native';
import PropTypes from 'prop-types';
import colors from '../../config/colors';

interface Props extends SwitchProps {
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
            <SwitchNative
                value={this.state.checked}
                disabled={disabled}
                onValueChange={this.handleChange}
                ios_backgroundColor={colors.TEXT_SECONDARY}
                trackColor={{
                    false: colors.TEXT_SECONDARY,
                    true: colors.GREEN_PRIMARY,
                }}
                {...smallProps}
                {...rest}
            />
        );
    }
}

export default Switch;
