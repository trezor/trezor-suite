/* @flow */


import React from 'react';
import ColorHash from 'color-hash';
import ScaleText from 'react-scale-text';
import * as stateUtils from '~/js/reducers/utils';
import BigNumber from 'bignumber.js';

import type { Props as BaseProps } from './index';

type Props = {
    pending: $PropertyType<$ElementType<BaseProps, 'selectedAccount'>, 'pending'>,
    tokens: $ElementType<BaseProps, 'tokens'>,
    removeToken: $ElementType<BaseProps, 'removeToken'>
}

const SummaryTokens = (props: Props) => {
    if (!props.tokens || props.tokens.length < 1) return null;

    const bgColor = new ColorHash({ lightness: 0.7 });
    const textColor = new ColorHash();

    const tokens = props.tokens.map((token, index) => {
        const iconColor = {
            color: textColor.hex(token.name),
            background: bgColor.hex(token.name),
            borderColor: bgColor.hex(token.name),
        };

        const pendingAmount: BigNumber = stateUtils.getPendingAmount(props.pending, token.symbol, true);
        const balance: string = new BigNumber(token.balance).minus(pendingAmount).toString(10);
        return (
            <div key={index} className="token">
                <div className="icon" style={iconColor}>
                    <div className="icon-inner">
                        <ScaleText widthOnly><p>{ token.symbol }</p></ScaleText>
                    </div>
                </div>
                <div className="name">{ token.name }</div>
                <div className="balance">{ balance } { token.symbol }</div>
                <button className="transparent" onClick={event => props.removeToken(token)} />
            </div>
        );
    });

    return (
        <div>
            { tokens }
        </div>
    );
};

export default SummaryTokens;