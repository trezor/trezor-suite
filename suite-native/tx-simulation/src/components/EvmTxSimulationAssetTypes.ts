import { type EvmAssetDiff, type EvmAssetExposure } from '@suite-common/tx-simulation';
import { type Network } from '@suite-common/wallet-config';

export type EvmTxSimulationAssetProps = {
    assetDiff?: EvmAssetDiff;
    assetExposure?: EvmAssetExposure;
    network: Network;
};
