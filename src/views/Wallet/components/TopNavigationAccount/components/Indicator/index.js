/* @flow */

import styled, { css } from 'styled-components';
import colors from 'config/colors';
import React, { PureComponent } from 'react';

type Props = {
    pathname: string;
    wrapper: () => ?HTMLElement;
}

type State = {
    style: {
        width: number;
        left: number;
    },
    shouldAnimate: boolean,
}

const Wrapper = styled.div`
    position: absolute;
    bottom: 0px;
    left: 0;
    width: 100px;
    height: 2px;
    background: ${colors.GREEN_PRIMARY};
    ${props => props.animation && css`
        transition: all 0.3s ease-in-out;
    `}
`;

class Indicator extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            style: {
                width: 0,
                left: 0,
            },
            shouldAnimate: false,
        };

        this.handleResize = this.handleResize.bind(this);
    }

    componentDidMount() {
        window.addEventListener('resize', this.handleResize, false);
    }

    componentWillReceiveProps(newProps: Props) {
        if (this.props.pathname !== newProps.pathname) {
            this.setState({
                shouldAnimate: true,
            });
        }
    }

    componentDidUpdate() {
        this.reposition(false);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize, false);
    }

    handleResize() {
        this.reposition();
    }

    handleResize: () => void;

    reposition(resetAnimation: boolean = true) {
        const wrapper = this.props.wrapper();
        if (!wrapper) return;
        const active = wrapper.querySelector('.active');
        if (!active) return;
        const bounds = active.getBoundingClientRect();
        const left = bounds.left - wrapper.getBoundingClientRect().left + wrapper.scrollLeft;
        const { state } = this;

        if (state.style.left !== left) {
            this.setState({
                style: {
                    width: bounds.width,
                    left,
                },
                shouldAnimate: resetAnimation ? false : state.shouldAnimate,
            });
        }
    }

    render() {
        if (!this.props.wrapper) return null;
        return (
            <Wrapper style={this.state.style} animation={this.state.shouldAnimate} />
        );
    }
}

export default Indicator;
