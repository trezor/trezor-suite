import type { NativeAddressAssetBalanceChangeDiff } from '@blockaid/client/resources';
import type { AccountSummary } from '@blockaid/client/resources/evm';

export type EvmAssetDiff =
    | AccountSummary.Erc20AddressAssetBalanceChangeDiff
    | AccountSummary.Erc721AddressAssetBalanceChangeDiff
    | AccountSummary.Erc1155AddressAssetBalanceChangeDiff
    | NativeAddressAssetBalanceChangeDiff;

export type EvmAssetExposure =
    | AccountSummary.Erc20AddressExposure
    | AccountSummary.Erc721AddressExposure
    | AccountSummary.Erc1155AddressExposure;

export type { TransactionScanResponse } from '@blockaid/client/resources';
