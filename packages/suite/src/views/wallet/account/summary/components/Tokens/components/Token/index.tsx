import React, { PureComponent } from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
// @ts-ignore
import ColorHash from 'color-hash';
// @ts-ignore
import ScaleText from 'react-scale-text';
import { Button, Icon, Tooltip, colors, icons as ICONS, variables } from '@trezor/components';
import * as stateUtils from '@wallet-utils/reducerUtils';
import BigNumber from 'bignumber.js';
import { Transaction, Token } from '@wallet-types/index';
import l10nCommonMessages from '@suite-views/index.messages';

const { FONT_WEIGHT } = variables;

const TokenWrapper = styled.div`
    padding: 14px 0;
    position: relative;
    display: flex;
    align-items: center;
    border-top: 1px solid ${colors.DIVIDER};
`;

const TokenIcon = styled.div<{ textColor: string; backgroundColor: string }>`
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

interface Props {
    token: Token;
    pending: Transaction[];
    removeToken: (token: Token) => void;
    hideBalance: boolean;
}

class AddedToken extends PureComponent<Props> {
    getTokenBalance(token: Token) {
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
                                size={14}
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
                    <Icon icon={ICONS.CLOSE} size={12} />
                </RemoveTokenButton>
            </TokenWrapper>
        );
    }
}

export default AddedToken;
