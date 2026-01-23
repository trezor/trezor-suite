import { AssetDiff, AssetExposure } from '@suite-common/tx-simulation';
import { Network } from '@suite-common/wallet-config';
import { Row } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { TxSimulationAssetLogo } from './TxSimulationAssetLogo';
import { TxSimulationAssetRow } from './TxSimulationAssetRow';

type TxSimulationAssetProps = {
    assetDiff?: AssetDiff;
    assetExposure?: AssetExposure;
    network: Network;
};

export const TxSimulationAsset = ({
    assetDiff,
    assetExposure,
    network,
}: TxSimulationAssetProps) => {
    const asset = (assetDiff || assetExposure)?.asset;
    const assetType = (assetDiff || assetExposure)?.asset_type;

    return (
        <Row columnGap={spacings.xs} padding={{ horizontal: spacings.md, vertical: spacings.sm }}>
            <TxSimulationAssetLogo asset={asset} assetType={assetType} network={network} />

            {assetDiff?.in.map((inAmount, inIndex) => (
                <TxSimulationAssetRow
                    key={`in-${inIndex}`}
                    variant="primary"
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
                    variant="destructive"
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
                        variant="tertiary"
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
