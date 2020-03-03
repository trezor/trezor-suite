import React from 'react';
import styled from 'styled-components';
import { colors, variables, Loader } from '@trezor/components';
import { HiddenPlaceholder, Badge, NoRatesTooltip, FiatValue } from '@suite-components';
import { Account } from '@wallet-types';
import BigNumber from 'bignumber.js';

const Wrapper = styled.div`
    display: flex;
    width: 100%;
    min-height: 80px;
    min-width: 250px;
    & + & {
        border-top: 1px solid ${colors.BLACK92};
    }
`;

const InfoCardContent = styled.div`
    display: flex;
    width: 100%;
    padding: 20px 16px 20px 20px;
    flex-direction: column;
`;

const AmountWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const STRIPE_COLOR = {
    green: colors.GREEN,
    red: colors.RED_ERROR,
};

const Stripe = styled.div<{ variant: 'green' | 'red' }>`
    width: 4px;
    display: flex;
    margin: 4px 4px;
    border-radius: 2px;
    background-color: ${props => STRIPE_COLOR[props.variant]};
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
    padding-top: 8px;
    width: 100%;
    justify-content: center;
    align-items: center;
`;

type Props =
    | {
          title: React.ReactNode;
          value?: string;
          symbol: Account['symbol'];
          isNumeric: boolean;
          stripe?: 'green' | 'red';
          isLoading?: boolean;
      }
    | {
          title: React.ReactNode;
          value?: string;
          stripe?: 'green' | 'red';
          symbol?: undefined;
          isNumeric?: undefined;
          isLoading?: boolean;
      };

const InfoCard = (props: Props) => {
    let bigValue = props.isNumeric && props.value ? new BigNumber(props.value) : null;
    bigValue = bigValue?.isNaN() ? null : bigValue;
    const isValuePos = bigValue?.gt(0);

    return (
        <Wrapper>
            <InfoCardContent>
                <Title>{props.title}</Title>
                <AmountWrapper>
                    {props.isLoading && (
                        <LoaderWrapper>
                            <Loader size={24} />
                        </LoaderWrapper>
                    )}

                    {!props.isLoading && (
                        <>
                            <Value>
                                {bigValue && (
                                    <>
                                        {isValuePos && '+'}
                                        {bigValue.toFixed()} {props.symbol?.toUpperCase()}
                                    </>
                                )}
                                {!bigValue && props.value}
                            </Value>
                            {props.isNumeric && props.value && (
                                <FiatAmountWrapper>
                                    <HiddenPlaceholder>
                                        <FiatValue amount={props.value} symbol={props.symbol}>
                                            {({ value }) =>
                                                value ? (
                                                    <Badge>{value}</Badge>
                                                ) : (
                                                    <NoRatesTooltip iconOnly />
                                                )
                                            }
                                        </FiatValue>
                                    </HiddenPlaceholder>
                                </FiatAmountWrapper>
                            )}
                        </>
                    )}
                </AmountWrapper>
            </InfoCardContent>
            {props.stripe && <Stripe variant={props.stripe} />}
        </Wrapper>
    );
};

export default InfoCard;
