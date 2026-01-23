import { Translation } from '@suite/intl';
import { AccountSummary } from '@suite-common/tx-simulation';
import { Network } from '@suite-common/wallet-config';
import { Card, Column, H4, Row, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

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
                <H4 margin={{ left: spacings.xxs }} typographyStyle="callout">
                    <Translation id="TR_SIMULATION" />
                </H4>
            }
            paddingType="small"
        >
            <Column
                margin={{
                    // @ts-expect-error - negative margins to align with card
                    horizontal: -spacings.md,
                    // @ts-expect-error - negative margins to align with card
                    vertical: -spacings.sm,
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
                            horizontal: spacings.md,
                            vertical: spacings.sm,
                        }}
                        justifyContent="center"
                    >
                        <Text variant="tertiary">
                            <Translation id="TR_SIMULATION_NO_ASSETS" />
                        </Text>
                    </Row>
                )}
            </Column>
        </Card>
    );
}
