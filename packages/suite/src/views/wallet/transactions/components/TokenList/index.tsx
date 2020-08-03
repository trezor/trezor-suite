import React, { Fragment } from 'react';
import styled, { css } from 'styled-components';
import { Account } from '@wallet-types';
import { FiatValue, FormattedCryptoAmount, Translation } from '@suite-components';
import { Section } from '@dashboard-components';
import { variables, colors, Icon, Link, Card } from '@trezor/components';
import { CARD_PADDING_SIZE } from '@suite-constants/layout';

const StyledSection = styled(Section)`
    margin-bottom: 30px;
`;

const Wrapper = styled(Card)`
    display: grid;
    grid-template-columns: ${(props: { isTestnet?: boolean }) =>
        props.isTestnet ? '4fr 1fr 44px' : '4fr 1fr 1fr 44px'};
    padding: 12px ${CARD_PADDING_SIZE};
`;

interface ColProps {
    justify?: 'left' | 'right';
    paddingHorizontal?: boolean;
    isTestnet?: boolean;
}

const TokenSymbol = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
    padding-right: 2px;
`;

const Col = styled.div<ColProps>`
    display: flex;
    align-items: center;
    padding: 10px 12px 10px 0px;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    border-top: 1px solid ${colors.BLACK96};

    &:nth-child(${props => (props.isTestnet ? '-n + 3' : '-n + 4')}) {
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

const TokenName = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    align-items: center;
`;

const TokenValue = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const FiatWrapper = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${colors.NEUE_STROKE_GREY};
    margin: 24px 0px;
`;

interface Props {
    tokens: Account['tokens'];
    explorerUrl: string;
    isTestnet?: boolean;
}

const TokenList = ({ tokens, explorerUrl, isTestnet }: Props) => {
    if (!tokens || tokens.length === 0) return null;
    return (
        <StyledSection heading={<Translation id="TR_TOKENS" />}>
            <Wrapper isTestnet={isTestnet} noPadding>
                {tokens.map(t => {
                    return (
                        <Fragment key={t.address}>
                            <Col isTestnet={isTestnet}>
                                <TokenName>
                                    <TokenSymbol>{t.symbol?.toUpperCase()}</TokenSymbol>
                                    {` - ${t.name}`}
                                </TokenName>
                            </Col>
                            <Col isTestnet={isTestnet} justify="right">
                                <TokenValue>
                                    {t.balance && (
                                        <FormattedCryptoAmount
                                            value={t.balance}
                                            symbol={t.symbol}
                                        />
                                    )}
                                </TokenValue>
                            </Col>
                            {!isTestnet && (
                                <Col isTestnet={isTestnet} justify="right">
                                    <FiatWrapper>
                                        {t.balance && t.symbol && (
                                            <FiatValue amount={t.balance} symbol={t.symbol} />
                                        )}
                                    </FiatWrapper>
                                </Col>
                            )}
                            <Col isTestnet={isTestnet} justify="right">
                                <Link href={`${explorerUrl}${t.address}`}>
                                    <Icon
                                        icon="EXTERNAL_LINK"
                                        size={16}
                                        color={colors.NEUE_TYPE_LIGHT_GREY}
                                    />
                                </Link>
                            </Col>
                        </Fragment>
                    );
                })}
            </Wrapper>
            <Divider />
        </StyledSection>
    );
};

export default TokenList;
