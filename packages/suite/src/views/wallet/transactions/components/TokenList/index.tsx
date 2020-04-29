import React, { Fragment } from 'react';
import styled, { css } from 'styled-components';
import { Account } from '@wallet-types';
import { Card, FiatValue, Badge, HiddenPlaceholder } from '@suite-components';
import { variables, colors, Icon, Link, CoinLogo } from '@trezor/components';
import { CARD_PADDING_SIZE } from '@suite-constants/layout';

const Wrapper = styled(Card)`
    display: grid;
    grid-column-gap: 12px;
    grid-template-columns: ${(props: { isTestnet?: boolean }) =>
        props.isTestnet ? '36px 4fr 1fr 44px' : '36px 4fr 1fr 1fr 44px'};
    margin-bottom: 20px;
    padding: 12px ${CARD_PADDING_SIZE};
`;

interface ColProps {
    justify?: 'left' | 'right';
    paddingHorizontal?: boolean;
    isTestnet?: boolean;
}

const Col = styled.div<ColProps>`
    display: flex;
    align-items: center;
    padding: 10px 0px;
    color: ${colors.BLACK0};
    font-size: ${variables.FONT_SIZE.SMALL};
    border-top: 1px solid ${colors.BLACK96};

    &:nth-child(${props => (props.isTestnet ? '-n + 4' : '-n + 5')}) {
        /* first row */
        border-top: none;
    }

    ${props =>
        props.justify &&
        css`
            justify-content: ${(props: ColProps) =>
                props.justify === 'right' ? 'flex-end' : 'flex-start'};
            text-align: ${(props: ColProps) => (props.justify === 'right' ? 'right' : 'left')};
        `}

    ${props =>
        props.paddingHorizontal &&
        css`
            padding-left: 14px;
            padding-right: 14px;
        `}
`;

const TokenImage = styled.div`
    display: flex;
    width: 24px;
    height: 24px;
    align-items: center;
    justify-content: center;
`;

const TokenName = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const TokenValue = styled.div`
    display: flex;
`;

const FiatWrapper = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
`;

interface Props {
    tokens: Account['tokens'];
    explorerUrl: string;
    isTestnet?: boolean;
}

const TokenList = ({ tokens, explorerUrl, isTestnet }: Props) => {
    if (!tokens) return null;
    return (
        <Wrapper isTestnet={isTestnet} noPadding>
            {tokens.map(t => {
                return (
                    <Fragment key={t.address}>
                        <Col>
                            <TokenImage>
                                <CoinLogo size={18} symbol="eth" color={colors.WHITE} />
                            </TokenImage>
                        </Col>
                        <Col>
                            <TokenName>{t.name}</TokenName>
                        </Col>
                        <Col justify="right">
                            <HiddenPlaceholder>
                                <TokenValue>{`${t.balance} ${t.symbol?.toUpperCase()}`}</TokenValue>
                            </HiddenPlaceholder>
                        </Col>
                        {!isTestnet && (
                            <Col isTestnet={isTestnet} justify="right">
                                <FiatWrapper>
                                    {t.balance && t.symbol && (
                                        <HiddenPlaceholder>
                                            <FiatValue amount={t.balance} symbol={t.symbol}>
                                                {({ value }) =>
                                                    value ? <Badge>{value}</Badge> : null
                                                }
                                            </FiatValue>
                                        </HiddenPlaceholder>
                                    )}
                                </FiatWrapper>
                            </Col>
                        )}
                        <Col justify="right">
                            <Link href={`${explorerUrl}${t.address}`}>
                                <Icon icon="EXTERNAL_LINK" size={16} color={colors.BLACK25} />
                            </Link>
                        </Col>
                    </Fragment>
                );
            })}
        </Wrapper>
    );
};

export default TokenList;
