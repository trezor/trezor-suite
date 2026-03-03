import { Translation } from '@suite/intl';
import { NetworkSymbol, getDisplaySymbol } from '@suite-common/wallet-config';
import { asAmountSubunit, subunitsToUnits } from '@suite-common/wallet-utils';
import { Card, Column, H3, IconCircle, Paragraph, Row } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { DashboardSection } from 'src/components/dashboard';
import { BaseCurrencyValue } from 'src/components/suite';

type ExternalStakingProviderCardProps = {
    symbol: NetworkSymbol;
    totalStaked: string;
};

export const ExternalStakingProviderCard = ({
    symbol,
    totalStaked,
}: ExternalStakingProviderCardProps) => {
    const displaySymbol = getDisplaySymbol(symbol);
    const totalStakedInUnits = subunitsToUnits({
        value: asAmountSubunit(new BigNumber(totalStaked || '0')),
        symbol,
    }).toString();

    return (
        <DashboardSection data-testid="@wallet/staking/outside-staking-card">
            <Card paddingType="large">
                <Row alignItems="start" gap={16}>
                    <IconCircle name="puzzlePiece" intent="brand" size={40} />
                    <Column gap={4}>
                        <H3>
                            <Translation id="TR_OUTSIDE_STAKING_CARD_TITLE" />
                        </H3>
                        <Paragraph intent="neutral" priority="secondary" maxWidth={700}>
                            <Translation
                                id="TR_OUTSIDE_STAKING_CARD_TEXT"
                                values={{
                                    amount: totalStakedInUnits,
                                    displaySymbol,
                                    fiat: (
                                        <BaseCurrencyValue
                                            amount={totalStakedInUnits}
                                            symbol={symbol}
                                        />
                                    ),
                                }}
                            />
                        </Paragraph>
                    </Column>
                </Row>
            </Card>
        </DashboardSection>
    );
};
