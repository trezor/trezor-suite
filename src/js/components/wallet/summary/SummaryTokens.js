/* @flow */
'use strict';

import React from 'react';
import ColorHash from 'color-hash';
import ScaleText from 'react-scale-text';

import type { Token } from '../../../reducers/TokensReducer';

type Props = {
    tokens: Array<Token>,
    removeToken: (token: Token) => void
}

const SummaryTokens = (props: Props) => {

    if (!props.tokens || props.tokens.length < 1) return null;

    const bgColor = new ColorHash({lightness: 0.7});
    const textColor = new ColorHash();

    const tokens = props.tokens.map((token, index) => {
        let iconColor = {
            color: textColor.hex(token.name),
            background: bgColor.hex(token.name),
            borderColor: bgColor.hex(token.name)
        }
        return (
            <div key={ index } className="token">
                <div className="icon" style={ iconColor }>
                    <div className="icon-inner">
                        <ScaleText widthOnly><p>{ token.symbol }</p></ScaleText>
                    </div>
                </div>
                <div className="name">{ token.name }</div>
                <div className="balance">{ token.balance } { token.symbol }</div>
                <button className="transparent" onClick={ event => props.removeToken(token) }></button>
            </div>
        )
    });

    return (
        <div>
            { tokens }
        </div>
    )
}

export default SummaryTokens;