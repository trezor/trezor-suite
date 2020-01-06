import React from 'react';
import styled from 'styled-components';
import { H2, P } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import TokenItem from './components/TokenItem';
import { Account } from '@wallet-types';

const TokensHeadingWrapper = styled.div`
    display: flex;
    padding: 20px 0;
`;

const AddedTokensWrapper = styled.div``;

interface Props {
    tokens: Exclude<Account['tokens'], undefined>;
    discreetMode: boolean;
}

const Tokens = ({ tokens, discreetMode }: Props) => {
    return (
        <>
            <TokensHeadingWrapper>
                <H2>
                    <Translation {...messages.TR_TOKENS} />
                </H2>
            </TokensHeadingWrapper>
            <AddedTokensWrapper>
                {tokens.length === 0 && <P textAlign="center">No tokens</P>}
                {tokens.map(token => (
                    <TokenItem key={token.address} token={token} discreetMode={discreetMode} />
                ))}
            </AddedTokensWrapper>
        </>
    );
};

export default Tokens;
