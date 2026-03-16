import { Translation } from '@suite/intl';
import { type AccountSummary } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { Card, Column, H4, Row, Text } from '@trezor/components';

import { TxSimulationAsset } from './TxSimulationAsset/TxSimulationAsset';

interface TxSimulationResultProps {
    accountSummary: AccountSummary;
    network: Network;
}

export function TxSimulationResult({
    accountSummary: { assets_diffs, exposures },
    network,
}: TxSimulationResultProps) {
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
                {assets_diffs.map((assetDiff, index) => (
                    <TxSimulationAsset key={index} assetDiff={assetDiff} network={network} />
                ))}
                {exposures.map((assetExposure, index) => (
                    <TxSimulationAsset
                        key={index}
                        assetExposure={assetExposure}
                        network={network}
                    />
                ))}
                {assets_diffs.length === 0 && exposures.length === 0 && (
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
