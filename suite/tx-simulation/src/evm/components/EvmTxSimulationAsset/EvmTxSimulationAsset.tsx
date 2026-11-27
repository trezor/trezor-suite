import { type ComponentProps } from 'react';

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

    const renderTransfer = (props: ComponentProps<typeof TxSimulationAssetRow>) => (
        <Row key={props.dataTestId} columnGap={8} padding={{ horizontal: 16, vertical: 12 }}>
            <TxSimulationAssetLogo asset={asset} assetType={assetType} network={network} />
            <TxSimulationAssetRow {...props} hasDedicatedRow />
        </Row>
    );

    return (
        <>
            {assetDiff?.in.map((inAmount, inIndex) =>
                renderTransfer({
                    intent: 'brand',
                    fiatAmount: inAmount.usd_price
                        ? { prefix: '+', value: inAmount.usd_price, currency: 'USD' }
                        : undefined,
                    dataTestId: `@sign-message-modal/tx-simulation-in-${inIndex}`,
                    children: <TxSimulationSummary amount={inAmount} assetDiff={assetDiff} />,
                }),
            )}
            {assetDiff?.out.map((outAmount, outIndex) =>
                renderTransfer({
                    intent: 'critical',
                    fiatAmount: outAmount.usd_price
                        ? { prefix: '-', value: outAmount.usd_price, currency: 'USD' }
                        : undefined,
                    dataTestId: `@sign-message-modal/tx-simulation-out-${outIndex}`,
                    children: <TxSimulationSummary amount={outAmount} assetDiff={assetDiff} />,
                }),
            )}
            {assetExposure?.spenders &&
                Object.values(assetExposure.spenders).map((spender, index) =>
                    renderTransfer({
                        intent: 'neutral',
                        priority: 'secondary',
                        fiatAmount: spender.exposure.usd_price
                            ? { value: spender.exposure.usd_price, currency: 'USD' }
                            : undefined,
                        dataTestId: `@sign-message-modal/tx-simulation-spender-${index}`,
                        children: <TxSimulationSummary amount={spender} assetDiff={assetDiff} />,
                    }),
                )}
        </>
    );
};
