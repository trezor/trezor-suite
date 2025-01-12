import { ReactNode } from 'react';

import styled from 'styled-components';

import { variables, Card, SkeletonRectangle, Column } from '@trezor/components';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { HiddenPlaceholder, FormattedCryptoAmount, Sign } from 'src/components/suite';
import { Account } from 'src/types/wallet';

const Title = styled.div`
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    text-transform: uppercase;
    margin-bottom: 10px;
`;

const Value = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    white-space: nowrap;
    line-height: 1.5;
`;

const SecondaryValueWrapper = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
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
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    white-space: nowrap;
    line-height: 1.5;
`;

type InfoCardProps = {
    title: ReactNode;
    value: ReactNode;
    secondaryValue: ReactNode;
    symbol?: Account['symbol'];
    isNumeric?: boolean;
    isLoading?: boolean;
};

export const InfoCard = (props: InfoCardProps) => {
    let bigValue =
        props.isNumeric && props.value && typeof props.value === 'string'
            ? new BigNumber(props.value)
            : null;
    bigValue = bigValue?.isNaN() ? null : bigValue;

    return (
        <Card minHeight={100}>
            <Column>
                <Title data-testid="@wallet/transactions/summary-card/title">{props.title}</Title>
                {props.isLoading && <SkeletonRectangle width="160px" />}

                {!props.isLoading && (
                    <>
                        {bigValue && props.symbol && (
                            <StyledFormattedValue
                                data-testid="@wallet/transactions/summary-card/value"
                                signValue={bigValue}
                                value={bigValue.abs().toFixed()}
                                symbol={props.symbol}
                            />
                        )}

                        {!bigValue && (
                            <Value data-testid="@wallet/transactions/summary-card/value">
                                {props.value}
                            </Value>
                        )}

                        {props.isNumeric && props.secondaryValue && (
                            <StyledHiddenPlaceholder>
                                <Value data-testid="@wallet/transactions/summary-card/secondary-value">
                                    <Sign value="positive" placeholderOnly />
                                    <SecondaryValueWrapper>
                                        {props.secondaryValue}
                                    </SecondaryValueWrapper>
                                </Value>
                            </StyledHiddenPlaceholder>
                        )}

                        {!props.isNumeric && props.secondaryValue && (
                            <SecondaryValueWrapper data-testid="@wallet/transactions/summary-card/secondary-value">
                                {props.secondaryValue}
                            </SecondaryValueWrapper>
                        )}
                    </>
                )}
            </Column>
        </Card>
    );
};
