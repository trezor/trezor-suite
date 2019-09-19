import React, { Component } from 'react';
import { Switch as SwitchNative, SwitchProps } from 'react-native';
import colors from '../../config/colors';

interface Props extends SwitchProps {
    onChange: (checked: boolean) => boolean | void;
    disabled?: boolean;
    isSmall?: boolean;
    checked: boolean;
}

class Switch extends Component<Props> {
    state = {
        checked: false,
    };

    constructor(props: Props) {
        super(props);
        this.state.checked = props.checked;
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
        const { checked } = this.state;
        const smallProps = isSmall ? { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] } : {};
        return (
            <SwitchNative
                value={checked}
                disabled={disabled}
                onValueChange={this.handleChange}
                ios_backgroundColor={colors.TEXT_SECONDARY}
                trackColor={{
                    false: colors.TEXT_SECONDARY,
                    true: colors.GREEN_PRIMARY,
                }}
                style={smallProps}
                {...rest}
            />
        );
    }
}

export { Switch, Props as SwitchProps };
