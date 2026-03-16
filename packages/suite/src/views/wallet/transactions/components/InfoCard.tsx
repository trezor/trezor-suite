import { type ReactNode } from 'react';

import { Card, Column, H4, Row, SkeletonRectangle, Text } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount, HiddenPlaceholder, Sign } from 'src/components/suite';
import { type Account } from 'src/types/wallet';

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
        <Card height="100%" minHeight={100}>
            <Column>
                <H4
                    typographyStyle="body-xs"
                    intent="neutral"
                    priority="secondary"
                    data-testid="@wallet/transactions/summary-card/title"
                    case="uppercase"
                    margin={{ bottom: 12 }}
                >
                    {props.title}
                </H4>
                {props.isLoading && <SkeletonRectangle width="160px" />}

                {!props.isLoading && (
                    <>
                        {bigValue && props.symbol && (
                            <FormattedCryptoAmount
                                data-testid="@wallet/transactions/summary-card/value"
                                signValue={bigValue}
                                value={bigValue.abs().toFixed()}
                                symbol={props.symbol}
                            />
                        )}

                        {!bigValue && (
                            <Row data-testid="@wallet/transactions/summary-card/value">
                                {props.value}
                            </Row>
                        )}

                        {props.isNumeric && props.secondaryValue && (
                            <HiddenPlaceholder>
                                <Row data-testid="@wallet/transactions/summary-card/secondary-value">
                                    <Sign value="positive" placeholderOnly />
                                    <Text
                                        intent="neutral"
                                        priority="secondary"
                                        typographyStyle="body-sm"
                                        as="div"
                                    >
                                        {props.secondaryValue}
                                    </Text>
                                </Row>
                            </HiddenPlaceholder>
                        )}

                        {!props.isNumeric && props.secondaryValue && (
                            <Text
                                intent="neutral"
                                priority="secondary"
                                typographyStyle="body-sm"
                                as="div"
                                data-testid="@wallet/transactions/summary-card/secondary-value"
                            >
                                {props.secondaryValue}
                            </Text>
                        )}
                    </>
                )}
            </Column>
        </Card>
    );
};
