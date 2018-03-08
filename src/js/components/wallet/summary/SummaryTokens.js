/* @flow */
'use strict';

import React from 'react';
import ColorHash from 'color-hash';
import ScaleText from 'react-scale-text';

const SummaryTokens = (props: any): any => {

    if (!props.tokens || props.tokens.length < 1) return null;

    const bgColor = new ColorHash({lightness: 0.7});
    const textColor = new ColorHash();

    const tokens = props.tokens.map((t, i) => {
        let iconColor = {
            color: textColor.hex(t.name),
            background: bgColor.hex(t.name),
            borderColor: bgColor.hex(t.name)
        }
        return (
            <div key={i} className="token">
                <div className="icon" style={ iconColor }>
                    <div className="icon-inner">
                        <ScaleText widthOnly><p>{ t.symbol }</p></ScaleText>
                    </div>
                </div>
                <div className="name">{ t.name }</div>
                <div className="balance">{ t.balance } { t.symbol }</div>
                <button className="transparent" onClick={ event => props.removeToken(t) }></button>
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