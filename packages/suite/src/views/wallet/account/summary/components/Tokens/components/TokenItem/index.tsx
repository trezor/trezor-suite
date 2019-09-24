import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import ColorHash from 'color-hash';
import ScaleText from 'react-scale-text';
import { Icon, Tooltip, colors, variables } from '@trezor/components';
import l10nCommonMessages from '@wallet-views/messages';
import { AccountInfo } from 'trezor-connect';

const TokenWrapper = styled.div`
    padding: 8px 0;
    position: relative;
    display: flex;
    align-items: center;
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
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
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

// const RemoveTokenButton = styled(Button)`
//     padding: 0 0 0 10px;
// `;

const TooltipIcon = styled(Icon)`
    cursor: pointer;
`;

interface Props {
    token: Required<AccountInfo>['tokens'][number]; // extract TokenInfo interface
    hideBalance: boolean;
}

const TokenItem = ({ token, hideBalance }: Props) => {
    const bgColor = new ColorHash({ lightness: 0.9 });
    const textColor = new ColorHash({ lightness: 0.3, saturation: 1 });

    return (
        <TokenWrapper>
            <TokenIcon
                textColor={textColor.hex(token.address)}
                backgroundColor={bgColor.hex(token.address)}
            >
                <ScaleText widthOnly>
                    <P>{token.symbol}</P>
                </ScaleText>
            </TokenIcon>

            <TokenName>{token.name}</TokenName>
            <TokenBalance>
                {hideBalance ? (
                    <Tooltip
                        maxWidth={200}
                        placement="top"
                        content={
                            <FormattedMessage
                                {...l10nCommonMessages.TR_THE_ACCOUNT_BALANCE_IS_HIDDEN}
                            />
                        }
                    >
                        <TooltipIcon icon="EYE_CROSSED" size={14} color={colors.TEXT_SECONDARY} />
                    </Tooltip>
                ) : (
                    <>
                        {token.balance} {token.symbol}
                    </>
                )}
            </TokenBalance>
            {/* <RemoveTokenButton
                    isTransparent
                    onClick={() => this.props.removeToken(this.props.token)}
                >
                    <Icon icon={ICONS.CLOSE} size={12} />
                </RemoveTokenButton> */}
        </TokenWrapper>
    );
};

export default TokenItem;
