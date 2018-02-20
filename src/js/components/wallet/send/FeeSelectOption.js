/* @flow */
'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';


// export default (props: any): any => {
//     console.log("RENDER CUSTOM OPTION", props)
//     return (
//         <div>1</div>
//     )
// }

class FeeSelectOption extends Component {
    constructor(props) {
        super(props);
    }

    handleMouseDown(event) {
        event.preventDefault();
        event.stopPropagation();
        this.props.onSelect(this.props.option, event);
    }

    handleMouseEnter(event) {
        this.props.onFocus(this.props.option, event);
    }

    handleMouseMove(event) {
        if (this.props.isFocused) return;
        this.props.onFocus(this.props.option, event);
    }

    render() {
        return (
            <div className={ this.props.className }
                onMouseDown={ this.handleMouseDown.bind(this) }
                onMouseEnter={ this.handleMouseEnter.bind(this) }
                onMouseMove={ this.handleMouseMove.bind(this) }>
                    <span className="fee-label">{ this.props.children }</span>
                   
                    <span className="fee-value">$10.20 / 8.828392159996002 ETH</span>
            </div>
        );
    }
}

FeeSelectOption.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    isDisabled: PropTypes.bool,
    isFocused: PropTypes.bool,
    isSelected: PropTypes.bool,
    onFocus: PropTypes.func,
    onSelect: PropTypes.func,
    option: PropTypes.object.isRequired,
};

export default FeeSelectOption;