/* @flow */


import * as React from 'react';
import PropTypes from 'prop-types';


export const FeeSelectValue = (props: any): any => (
    <div>
        <div className="Select-value fee-option">
            <span className="fee-value">{ props.value.value }</span>
            <span className="fee-label">{ props.value.label }</span>
        </div>
    </div>
);

type Props = {
    children: React.Node,
    className: string,
    isDisabled: boolean,
    isFocused: boolean,
    isSelected: boolean,
    onFocus: Function,
    onSelect: Function,
    option: any,
}

export class FeeSelectOption extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
    }

    handleMouseDown(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.props.onSelect(this.props.option, event);
    }

    handleMouseEnter(event: MouseEvent) {
        this.props.onFocus(this.props.option, event);
    }

    handleMouseMove(event: MouseEvent) {
        if (this.props.isFocused) return;
        this.props.onFocus(this.props.option, event);
    }

    render() {
        return (
            <div
                className={this.props.className}
                onMouseDown={this.handleMouseDown.bind(this)}
                onMouseEnter={this.handleMouseEnter.bind(this)}
                onMouseMove={this.handleMouseMove.bind(this)}
            >
                <span className="fee-value">{ this.props.option.value }</span>
                <span className="fee-label">{ this.props.option.label }</span>
            </div>
        );
    }
}
