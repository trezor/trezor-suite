/* @flow */


import * as React from 'react';

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

export default class CoinSelectOption extends React.Component<Props> {
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
        const css = `${this.props.className} ${this.props.option.value}`;
        return (
            <div
                className={css}
                onMouseDown={this.handleMouseDown.bind(this)}
                onMouseEnter={this.handleMouseEnter.bind(this)}
                onMouseMove={this.handleMouseMove.bind(this)}
                title={this.props.option.label}
            >
                <span>{ this.props.children }</span>
            </div>
        );
    }
}