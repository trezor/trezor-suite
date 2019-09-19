import React, { Component } from 'react';
import ReactSwitch, { ReactSwitchProps } from 'react-switch';
import colors from '../../config/colors';

interface Props extends ReactSwitchProps {
    onChange: (checked: boolean) => any;
    disabled?: boolean;
    isSmall?: boolean;
}

interface StateProps {
    checked: boolean;
}

class Switch extends Component<Props, StateProps> {
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

export { Switch, Props as SwitchProps };
