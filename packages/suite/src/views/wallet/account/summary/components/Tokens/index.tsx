import React from 'react';
import styled from 'styled-components';
import { H2, P } from '@trezor/components-v2';
import { FormattedMessage } from 'react-intl';
import l10nMessages from '../../common.messages';
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
                <H2>
                    <FormattedMessage {...l10nMessages.TR_TOKENS} />
                </H2>
            </TokensHeadingWrapper>
            <AddedTokensWrapper>
                {tokens.length === 0 && <P textAlign="center">No tokens</P>}
                {tokens.map(token => (
                    <TokenItem key={token.address} token={token} hideBalance={hideBalance} />
                ))}
            </AddedTokensWrapper>
        </>
    );
};

export default Tokens;
