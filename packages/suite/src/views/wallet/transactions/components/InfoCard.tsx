import { ReactNode } from 'react';

import styled, { useTheme } from 'styled-components';

import { Card, Column, Paragraph, SkeletonRectangle } from '@trezor/components';
import { typography } from '@trezor/theme';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import { FormattedCryptoAmount, HiddenPlaceholder, Sign } from 'src/components/suite';
import { Account } from 'src/types/wallet';

const Value = styled.div`
    display: flex;
    ${typography.label}
    color: ${({ theme }) => theme.textDefault};
    white-space: nowrap;
`;

const SecondaryValueWrapper = styled.div`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
    font-variant-numeric: tabular-nums;
`;

const StyledHiddenPlaceholder = styled(HiddenPlaceholder)`
    display: flex;
`;

const StyledFormattedValue = styled(FormattedCryptoAmount)`
    display: flex;
    ${typography.body}
    color: ${({ theme }) => theme.textDefault};
    white-space: nowrap;
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
    const theme = useTheme();
    let bigValue =
        props.isNumeric && props.value && typeof props.value === 'string'
            ? new BigNumber(props.value)
            : null;
    bigValue = bigValue?.isNaN() ? null : bigValue;

    return (
        <Card minHeight={100}>
            <Column>
                <Paragraph
                    typographyStyle="label"
                    color={theme.textSubdued}
                    data-testid="@wallet/transactions/summary-card/title"
                    case="uppercase"
                    margin={{ bottom: 12 }}
                >
                    {props.title}
                </Paragraph>
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
