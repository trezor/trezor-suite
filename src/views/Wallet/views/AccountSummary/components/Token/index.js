import React, { Component } from 'react';
import styled from 'styled-components';
import ColorHash from 'color-hash';
import ScaleText from 'react-scale-text';
import colors from 'config/colors';
import Button from 'components/Button';
import Icon from 'components/Icon';
import ICONS from 'config/icons';
import * as stateUtils from 'reducers/utils';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';

const TokenWrapper = styled.div`
    padding: 14px 0;
    position: relative;
    display: flex;
    align-items: center;
    border-top: 1px solid ${colors.DIVIDER};
`;

const TokenIcon = styled.div`
    width: 36px;
    height: 36px;
    border-radius: 50%;
    margin-right: 10px;
    line-height: 30px;
    text-transform: uppercase;
    user-select: none;
    text-align: center;
    padding: 6px;
    color: ${props => props.textColor};
    border-color: ${props => props.backgroundColor};
    background: ${props => props.backgroundColor};
`;

const P = styled.p`
    line-height: 24px;
    padding: 0px;
    color: inherit;
`;

const TokenName = styled.div`
    flex: 1;
    color: ${colors.TEXT_SECONDARY};
`;

const TokenBalance = styled.div``;

const RemoveTokenButton = styled(Button)`
    padding: 0 0 0 10px;
`;

class AddedToken extends Component<> {
    getTokenBalance(token) {
        const pendingAmount = stateUtils.getPendingAmount(this.props.pending, token.symbol, true);
        const balance = new BigNumber(token.balance).minus(pendingAmount).toString(10);
        return balance;
    }

    render() {
        const bgColor = new ColorHash({ lightness: 0.16 });
        const textColor = new ColorHash();

        return (
            <TokenWrapper key={this.props.token.symbol}>
                <TokenIcon
                    textColor={textColor.hex(this.props.token.address)}
                    backgroundColor={bgColor.hex(this.props.token.address)}
                >
                    <ScaleText widthOnly>
                        <P>{this.props.token.symbol}</P>
                    </ScaleText>
                </TokenIcon>

                <TokenName>{this.props.token.name}</TokenName>
                <TokenBalance>{this.getTokenBalance(this.props.token)} {this.props.token.symbol}</TokenBalance>
                <RemoveTokenButton
                    isTransparent
                    onClick={() => this.props.removeToken(this.props.token)}
                >
                    <Icon
                        icon={ICONS.CLOSE}
                        size={23}
                    />
                </RemoveTokenButton>
            </TokenWrapper>
        );
    }
}

AddedToken.propTypes = {
    token: PropTypes.object,
    pending: PropTypes.array,
    removeToken: PropTypes.func,
};

export default AddedToken;
