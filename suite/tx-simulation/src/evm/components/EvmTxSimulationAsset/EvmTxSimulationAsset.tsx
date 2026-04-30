import { type EvmAssetDiff, type EvmAssetExposure } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';

import { TxSimulationAssetLogo } from './TxSimulationAssetLogo';
import { TxSimulationSummary } from './TxSimulationSummary';
import { TxSimulationAssetRow } from '../../../common';

type TxSimulationAssetProps = {
    assetDiff?: EvmAssetDiff;
    assetExposure?: EvmAssetExposure;
    network: Network;
};

export const EvmTxSimulationAsset = ({
    assetDiff,
    assetExposure,
    network,
}: TxSimulationAssetProps) => {
    const asset = (assetDiff || assetExposure)?.asset;
    const assetType = (assetDiff || assetExposure)?.asset_type;

    return (
        <Row columnGap={8} padding={{ horizontal: 16, vertical: 12 }}>
            <TxSimulationAssetLogo asset={asset} assetType={assetType} network={network} />

            {assetDiff?.in.map((inAmount, inIndex) => (
                <TxSimulationAssetRow
                    key={`in-${inIndex}`}
                    intent="brand"
                    fiatAmount={
                        inAmount.usd_price
                            ? {
                                  prefix: '+',
                                  value: inAmount.usd_price,
                                  currency: 'USD',
                              }
                            : undefined
                    }
                    dataTestId={`@sign-message-modal/tx-simulation-in-${inIndex}`}
                >
                    <TxSimulationSummary amount={inAmount} assetDiff={assetDiff} />
                </TxSimulationAssetRow>
            ))}
            {assetDiff?.out.map((outAmount, outIndex) => (
                <TxSimulationAssetRow
                    key={`out-${outIndex}`}
                    intent="critical"
                    fiatAmount={
                        outAmount.usd_price
                            ? {
                                  prefix: '-',
                                  value: outAmount.usd_price,
                                  currency: 'USD',
                              }
                            : undefined
                    }
                    dataTestId={`@sign-message-modal/tx-simulation-out-${outIndex}`}
                >
                    <TxSimulationSummary amount={outAmount} assetDiff={assetDiff} />
                </TxSimulationAssetRow>
            ))}
            {assetExposure?.spenders &&
                Object.values(assetExposure.spenders).map((spender, index) => (
                    <TxSimulationAssetRow
                        key={`spender-${index}`}
                        intent="neutral"
                        priority="secondary"
                        fiatAmount={
                            spender.exposure.usd_price
                                ? {
                                      value: spender.exposure.usd_price,
                                      currency: 'USD',
                                  }
                                : undefined
                        }
                        dataTestId={`@sign-message-modal/tx-simulation-spender-${index}`}
                    >
                        <TxSimulationSummary amount={spender} assetDiff={assetDiff} />
                    </TxSimulationAssetRow>
                ))}
        </Row>
    );
};
