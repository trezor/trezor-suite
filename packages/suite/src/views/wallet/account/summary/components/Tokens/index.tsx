import React from 'react';
import styled from 'styled-components';
import { H5 } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import l10nMessages from './index.messages';
import TokenItem from './components/TokenItem';
import { Account } from '@wallet-types';

const TokensHeadingWrapper = styled.div`
    display: flex;
    padding: 20px 0;
`;

const AddedTokensWrapper = styled.div``;

interface Props {
    tokens: Exclude<Account['tokens'], undefined>;
    hideBalance: boolean;
}

const Tokens = ({ tokens, hideBalance }: Props) => {
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

export default Tokens;
