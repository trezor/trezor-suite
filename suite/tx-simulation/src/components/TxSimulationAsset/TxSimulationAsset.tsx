import { type EvmAssetDiff, type EvmAssetExposure } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';

import { TxSimulationAssetLogo } from './TxSimulationAssetLogo';
import { TxSimulationAssetRow } from './TxSimulationAssetRow';

type TxSimulationAssetProps = {
    assetDiff?: EvmAssetDiff;
    assetExposure?: EvmAssetExposure;
    network: Network;
};

// FIXME: rename to EvmTxSimulationAsset
export const TxSimulationAsset = ({
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
                    amountPrefix="+"
                    amount={inAmount}
                    fiatAmount={inAmount.usd_price}
                    fiatCurrency="USD"
                    assetDiff={assetDiff}
                    dataTestId={`@sign-message-modal/tx-simulation-in-${inIndex}`}
                />
            ))}
            {assetDiff?.out.map((outAmount, outIndex) => (
                <TxSimulationAssetRow
                    key={`out-${outIndex}`}
                    intent="critical"
                    amountPrefix="-"
                    amount={outAmount}
                    fiatAmount={outAmount.usd_price}
                    fiatCurrency="USD"
                    assetDiff={assetDiff}
                    dataTestId={`@sign-message-modal/tx-simulation-out-${outIndex}`}
                />
            ))}
            {assetExposure?.spenders &&
                Object.values(assetExposure.spenders).map((spender, index) => (
                    <TxSimulationAssetRow
                        key={`spender-${index}`}
                        intent="neutral"
                        priority="secondary"
                        amount={spender}
                        fiatAmount={spender.exposure.usd_price}
                        fiatCurrency="USD"
                        assetDiff={assetDiff}
                        dataTestId={`@sign-message-modal/tx-simulation-spender-${index}`}
                    />
                ))}
        </Row>
    );
};
