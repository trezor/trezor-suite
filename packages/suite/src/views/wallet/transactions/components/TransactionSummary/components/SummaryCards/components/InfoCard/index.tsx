import React from 'react';
import styled from 'styled-components';
import { variables, Card } from '@trezor/components';
import {
    HiddenPlaceholder,
    FormattedCryptoAmount,
    Sign,
    SkeletonRectangle,
} from '@suite-components';
import { Account } from '@wallet-types';
import BigNumber from 'bignumber.js';

const Wrapper = styled(Card)`
    display: flex;
    padding: 14px 16px;
    flex: 1;
    min-height: 100px;
`;

const InfoCardContent = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    text-transform: uppercase;
    margin-bottom: 10px;
`;

const Value = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
    white-space: nowrap;
    line-height: 1.5;
`;

const SecondaryValueWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-variant-numeric: tabular-nums;
    /* margin-left: 1ch; */
    line-height: 1.57;
`;

const StyledHiddenPlaceholder = styled(HiddenPlaceholder)`
    display: flex;
`;

const StyledFormattedValue = styled(FormattedCryptoAmount)`
    display: flex;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
    white-space: nowrap;
    line-height: 1.5;
`;

type Props = {
    title: React.ReactNode;
    value: React.ReactNode;
    secondaryValue: React.ReactNode;
    symbol?: Account['symbol'];
    isNumeric?: boolean;
    isLoading?: boolean;
};

const InfoCard = (props: Props) => {
    let bigValue =
        props.isNumeric && props.value && typeof props.value === 'string'
            ? new BigNumber(props.value)
            : null;
    bigValue = bigValue?.isNaN() ? null : bigValue;

    return (
        <Wrapper>
            <InfoCardContent>
                <Title>{props.title}</Title>
                {props.isLoading && <SkeletonRectangle width="160px" />}

                {!props.isLoading && (
                    <>
                        {bigValue && props.symbol && (
                            <StyledFormattedValue
                                signValue={bigValue}
                                value={bigValue.abs().toFixed()}
                                symbol={props.symbol}
                            />
                        )}
                        {!bigValue && <Value>{props.value}</Value>}
                        {props.isNumeric && props.secondaryValue && (
                            <StyledHiddenPlaceholder>
                                <Value>
                                    <Sign value="pos" placeholderOnly />
                                    <SecondaryValueWrapper>
                                        {props.secondaryValue}
                                    </SecondaryValueWrapper>
                                </Value>
                            </StyledHiddenPlaceholder>
                        )}
                        {!props.isNumeric && props.secondaryValue && (
                            <SecondaryValueWrapper>{props.secondaryValue}</SecondaryValueWrapper>
                        )}
                    </>
                )}
            </InfoCardContent>
        </Wrapper>
    );
};

export default InfoCard;
