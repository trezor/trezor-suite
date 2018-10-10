/* @flow */

import styled from 'styled-components';
import colors from 'config/colors';
import React, { Component } from 'react';

type Props = {
    pathname: string;
}

type State = {
    style: {
        width: number;
        left: number;
    }
}

const Wrapper = styled.div`
    position: absolute;
    bottom: 0px;
    left: 0;
    width: 100px;
    height: 2px;
    background: ${colors.GREEN_PRIMARY};
    transition: all 0.3s ease-in-out;
`;

class Indicator extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            style: {
                width: 0,
                left: 0,
            },
        };

        this.reposition = this.reposition.bind(this);
    }

    componentDidMount() {
        this.reposition();
        window.addEventListener('resize', this.reposition, false);
    }

    componentDidUpdate() {
        this.reposition();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.reposition, false);
    }

    reposition() {
        const tabs = document.querySelector('.account-tabs');
        if (!tabs) return;
        const active = tabs.querySelector('.active');
        if (!active) return;
        const bounds = active.getBoundingClientRect();

        const left = bounds.left - tabs.getBoundingClientRect().left;

        if (this.state.style.left !== left) {
            this.setState({
                style: {
                    width: bounds.width,
                    left,
                },
            });
        }
    }

    reposition: () => void;

    handleResize() {
        this.reposition();
    }

    render() {
        return (
            <Wrapper style={this.state.style}>{ this.props.pathname }</Wrapper>
        );
    }
}

export default Indicator;
