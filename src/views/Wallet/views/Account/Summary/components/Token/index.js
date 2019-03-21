import React, { PureComponent } from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import ColorHash from 'color-hash';
import ScaleText from 'react-scale-text';
import { FONT_WEIGHT } from 'config/variables';
import { Button, Icon, Tooltip, colors, icons as ICONS } from 'trezor-ui-components';
import * as stateUtils from 'reducers/utils';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import l10nCommonMessages from 'views/common.messages';

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

const TokenText = styled.div`
    font-weight: ${FONT_WEIGHT.MEDIUM};
    color: ${colors.TEXT_SECONDARY};
`;

const TokenName = styled(TokenText)`
    flex: 1 1 0;
    padding-right: 5px;
`;

const TokenBalance = styled(TokenText)`
    flex: 1 0 0;
    word-break: break-all;
    text-align: right;
`;

const RemoveTokenButton = styled(Button)`
    padding: 0 0 0 10px;
`;

const TooltipIcon = styled(Icon)`
    cursor: pointer;
`;

class AddedToken extends PureComponent {
    getTokenBalance(token) {
        const pendingAmount = stateUtils.getPendingAmount(this.props.pending, token.symbol, true);
        const balance = new BigNumber(token.balance).minus(pendingAmount).toString(10);
        return balance;
    }

    render() {
        const bgColor = new ColorHash({ lightness: 0.9 });
        const textColor = new ColorHash({ lightness: 0.3, saturation: 1 });

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
                <TokenBalance>
                    {this.props.hideBalance ? (
                        <Tooltip
                            maxWidth={200}
                            placement="top"
                            content={
                                <FormattedMessage
                                    {...l10nCommonMessages.TR_THE_ACCOUNT_BALANCE_IS_HIDDEN}
                                />
                            }
                        >
                            <TooltipIcon
                                icon={ICONS.EYE_CROSSED}
                                size={25}
                                color={colors.TEXT_SECONDARY}
                            />
                        </Tooltip>
                    ) : (
                        `${this.getTokenBalance(this.props.token)}  ${this.props.token.symbol}`
                    )}
                </TokenBalance>
                <RemoveTokenButton
                    isTransparent
                    onClick={() => this.props.removeToken(this.props.token)}
                >
                    <Icon icon={ICONS.CLOSE} size={23} />
                </RemoveTokenButton>
            </TokenWrapper>
        );
    }
}

AddedToken.propTypes = {
    token: PropTypes.object,
    pending: PropTypes.array,
    removeToken: PropTypes.func,
    hideBalance: PropTypes.bool,
};

export default AddedToken;
