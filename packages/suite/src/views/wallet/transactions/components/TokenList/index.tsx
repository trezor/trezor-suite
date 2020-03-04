import React from 'react';
import styled from 'styled-components';
import { Account } from '@wallet-types';
import { Card } from '@suite-components';
// @ts-ignore no types for this lib
import ScaleText from 'react-scale-text';
import { variables, colors, Icon, Link } from '@trezor/components';

const Wrapper = styled(Card)`
    flex-direction: column;
    margin-bottom: 20px;
`;

const TokenItem = styled.div`
    display: flex;
    width: 100%;
    align-items: center;
    padding: 10px 14px;
    color: ${colors.BLACK0};
    font-size: ${variables.FONT_SIZE.SMALL};

    & + & {
        border-top: 1px solid ${colors.BLACK96};
    }
`;

const TokenImage = styled.div`
    display: flex;
    margin-right: 12px;
    background: #8a92b2;
    color: #fefefe;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    align-items: center;
    /* line-height: 30px; */
    text-transform: uppercase;
    user-select: none;
    text-align: center;
    padding: 3px;
`;

const TokenName = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 12px;
`;

const TokenValue = styled.div`
    display: flex;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 28px;
`;

interface Props {
    tokens: Account['tokens'];
    explorerUrl: string;
}

const TokenList = ({ tokens, explorerUrl }: Props) => {
    return (
        <Wrapper>
            {tokens &&
                tokens.map(t => {
                    return (
                        <TokenItem key={t.address}>
                            <TokenImage>
                                <ScaleText widthOnly>{t.symbol}</ScaleText>
                            </TokenImage>
                            <TokenName>{t.name}</TokenName>
                            <TokenValue>{`${t.balance} ${t.symbol?.toUpperCase()}`}</TokenValue>
                            <Link href={`${explorerUrl}${t.address}`}>
                                <Icon icon="EXTERNAL_LINK" size={16} color={colors.BLACK25} />
                            </Link>
                        </TokenItem>
                    );
                })}
        </Wrapper>
    );
};

export default TokenList;
