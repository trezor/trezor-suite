import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Icon, Tooltip, colors, variables } from '@trezor/components';
import l10nCommonMessages from '@wallet-views/messages';
import { formatAmount } from '@wallet-utils/accountUtils';
import { AccountInfo } from 'trezor-connect';
import TokenIcon from '../TokenIcon';

const TokenWrapper = styled.div`
    padding: 8px 0;
    position: relative;
    display: flex;
    align-items: center;
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

const TooltipIcon = styled(Icon)`
    cursor: pointer;
`;

interface Props {
    token: Required<AccountInfo>['tokens'][number]; // extract TokenInfo interface
    hideBalance: boolean;
}

const TokenItem = ({ token, hideBalance }: Props) => {
    return (
        <TokenWrapper>
            <TokenIcon address={token.address} symbol={token.symbol} />
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
                        {formatAmount(token.balance || '0', token.decimals)} {token.symbol}
                    </>
                )}
            </TokenBalance>
        </TokenWrapper>
    );
};

export default TokenItem;
