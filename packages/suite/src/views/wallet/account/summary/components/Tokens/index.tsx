import React from 'react';
import styled from 'styled-components';
import { H5, colors } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import l10nMessages from '../../common.messages';
import TokenItem from './components/TokenItem';
import { Account } from '@wallet-types';

const TokensHeadingWrapper = styled.div`
    display: flex;
    padding: 20px 0;
`;

const NoTokens = styled.div`
    display: flex;
    justify-content: center;
    color: ${colors.TEXT_SECONDARY};
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
                {tokens.length === 0 && <NoTokens>No tokens</NoTokens>}
                {tokens.map(token => (
                    <TokenItem key={token.address} token={token} hideBalance={hideBalance} />
                ))}
            </AddedTokensWrapper>
        </>
    );
};

export default Tokens;
