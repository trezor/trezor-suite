import React, { Fragment } from 'react';
import styled, { css } from 'styled-components';
import { Account } from '@wallet-types';
import { Card, FiatValue, Badge, HiddenPlaceholder } from '@suite-components';
// @ts-ignore no types for this lib
import ScaleText from 'react-scale-text';
import { variables, colors, Icon, Link } from '@trezor/components';

const Wrapper = styled(Card)`
    display: grid;
    grid-column-gap: 12px;
    grid-template-columns: ${(props: { isTestnet?: boolean }) =>
        props.isTestnet ? '52px 4fr 1fr 44px' : '52px 4fr 1fr 1fr 44px'};
    margin-bottom: 20px;
`;

interface ColProps {
    justify?: 'left' | 'right';
    paddingHorizontal?: boolean;
}

const Col = styled.div<ColProps>`
    display: flex;
    align-items: center;
    padding: 10px 0px;
    color: ${colors.BLACK0};
    font-size: ${variables.FONT_SIZE.SMALL};
    border-top: 1px solid ${colors.BLACK96};

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
    return (
        <Wrapper isTestnet={isTestnet}>
            {tokens &&
                tokens.map(t => {
                    return (
                        <Fragment key={t.address}>
                            <Col paddingHorizontal>
                                <TokenImage>
                                    <ScaleText widthOnly>{t.symbol}</ScaleText>
                                </TokenImage>
                            </Col>
                            <Col>
                                <TokenName>{t.name}</TokenName>
                            </Col>
                            <Col justify="right">
                                <HiddenPlaceholder>
                                    <TokenValue>{`${
                                        t.balance
                                    } ${t.symbol?.toUpperCase()}`}</TokenValue>
                                </HiddenPlaceholder>
                            </Col>
                            {!isTestnet && (
                                <Col justify="right">
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
                            <Col paddingHorizontal>
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
