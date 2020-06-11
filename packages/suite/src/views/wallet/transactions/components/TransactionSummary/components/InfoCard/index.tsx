import React from 'react';
import styled from 'styled-components';
import { colors, variables, Loader } from '@trezor/components';
import { HiddenPlaceholder, Badge, FormattedNumber } from '@suite-components';
import { Account } from '@wallet-types';
import BigNumber from 'bignumber.js';
import { CARD_PADDING_SIZE } from '@suite-constants/layout';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    min-height: 80px;
    min-width: 320px;

    & + & {
        border-top: 1px solid ${colors.BLACK92};
    }

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        width: 100%;
    }
`;

const InfoCardContent = styled.div`
    display: flex;
    width: 100%;
    padding: ${CARD_PADDING_SIZE};
    flex-direction: column;
`;

const AmountWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${colors.BLACK50};
    text-transform: uppercase;
`;

const Value = styled.div`
    font-size: ${variables.FONT_SIZE.NORMAL};
    color: ${colors.BLACK0};
    white-space: nowrap;
`;

const FiatAmountWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    margin-left: 20px;
`;

const LoaderWrapper = styled.div`
    display: flex;
    /* padding-top: 8px; */
    width: 100%;
    justify-content: center;
    align-items: center;
`;

type Props =
    | {
          title: React.ReactNode;
          value?: JSX.Element | string;
          fiatValue?: string;
          localCurrency: string;
          symbol: Account['symbol'];
          isNumeric: boolean;
          isLoading?: boolean;
      }
    | {
          title: React.ReactNode;
          value?: JSX.Element | string;
          symbol?: undefined;
          isNumeric?: undefined;
          isLoading?: boolean;
      };

const InfoCard = (props: Props) => {
    let bigValue =
        props.isNumeric && props.value && typeof props.value === 'string'
            ? new BigNumber(props.value)
            : null;
    bigValue = bigValue?.isNaN() ? null : bigValue;
    const isValuePos = bigValue?.gt(0);

    return (
        <Wrapper>
            <InfoCardContent>
                <Title>{props.title}</Title>
                <AmountWrapper>
                    {props.isLoading && (
                        <LoaderWrapper>
                            <Loader size={22} />
                        </LoaderWrapper>
                    )}

                    {!props.isLoading && (
                        <>
                            <Value>
                                {bigValue && (
                                    <HiddenPlaceholder>
                                        {isValuePos && '+'}
                                        {bigValue.toFixed()} {props.symbol?.toUpperCase()}
                                    </HiddenPlaceholder>
                                )}
                                {!bigValue && props.value}
                            </Value>
                            {props.isNumeric && props.fiatValue && (
                                <HiddenPlaceholder>
                                    <FiatAmountWrapper>
                                        <Badge>
                                            <FormattedNumber
                                                value={props.fiatValue}
                                                currency={props.localCurrency}
                                            />
                                        </Badge>
                                    </FiatAmountWrapper>
                                </HiddenPlaceholder>
                            )}
                        </>
                    )}
                </AmountWrapper>
            </InfoCardContent>
        </Wrapper>
    );
};

export default InfoCard;
