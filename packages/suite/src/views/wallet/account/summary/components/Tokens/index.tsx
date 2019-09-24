import React from 'react';
import styled from 'styled-components';
import { Icon, Link, CoinLogo, H5, Tooltip, variables, colors } from '@trezor/components';
import { FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import l10nMessages from './index.messages';
import TokenItem from './components/TokenItem';
import { Account } from '@wallet-types';

const TokensHeadingWrapper = styled.div`
    display: flex;
    padding: 20px 0;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    margin-right: 1px;
`;

const AddedTokensWrapper = styled.div``;

interface Props extends InjectedIntlProps {
    tokens: Exclude<Account['tokens'], undefined>;
    hideBalance: boolean;
}

const Tokens = ({ tokens, hideBalance, ...props }: Props) => {
    return (
        <>
            <TokensHeadingWrapper>
                <H5>
                    <FormattedMessage {...l10nMessages.TR_TOKENS} />
                </H5>
            </TokensHeadingWrapper>
            <AddedTokensWrapper>
                {tokens.map(token => (
                    <TokenItem key={token.symbol} token={token} hideBalance={hideBalance} />
                ))}
            </AddedTokensWrapper>
        </>
    );
};

export default injectIntl(Tokens);
