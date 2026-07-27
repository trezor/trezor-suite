import { type ReactNode } from 'react';

import { Translation } from '@suite/intl';
import { Card, Column, H4, Row, Text } from '@trezor/components';

interface TxSimulationResultProps {
    children: ReactNode;
    isEmpty: boolean;
}

export function TxSimulationResult({ children, isEmpty }: TxSimulationResultProps) {
    return (
        <Card
            header={
                <H4 margin={{ left: 4 }} typographyStyle="body-sm-strong">
                    <Translation id="TR_SIMULATION" />
                </H4>
            }
            paddingType="small"
        >
            <Column
                margin={{
                    // Negative margins to align with card
                    horizontal: -16,
                    // Negative margins to align with card
                    vertical: -12,
                }}
                hasDivider
            >
                {children}

                {isEmpty && (
                    <Row
                        padding={{
                            horizontal: 16,
                            vertical: 12,
                        }}
                        justifyContent="center"
                    >
                        <Text intent="neutral" priority="secondary">
                            <Translation id="TR_SIMULATION_NO_ASSETS" />
                        </Text>
                    </Row>
                )}
            </Column>
        </Card>
    );
}
