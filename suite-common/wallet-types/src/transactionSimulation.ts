import type {
    EthereumSignTransaction,
    EthereumSignTypedData,
    EthereumSignTypedDataTypes,
    SolanaSignTransaction,
    StellarSignTransaction,
} from '@trezor/connect';
import type { SolanaNetworkSymbol } from '@trezor/network-solana/constants';
import type { StellarNetworkSymbol } from '@trezor/network-stellar/constants';

type TxSimulationActionBase = {
    sourceOrigin: string;
    fromAddress: string;
};

export type TxSimulationAction = TxSimulationActionBase &
    (
        | {
              method: 'ethereumSignTransaction';
              payload: EthereumSignTransaction;
          }
        | {
              method: 'ethereumSignTypedData';
              payload: EthereumSignTypedData<EthereumSignTypedDataTypes>;
          }
        | {
              method: 'solanaSignTransaction';
              // Unlike EVM there is no chainId in the payload, so mainnet/devnet has to be carried.
              symbol: SolanaNetworkSymbol;
              payload: SolanaSignTransaction;
          }
        | {
              method: 'stellarSignTransaction';
              symbol: StellarNetworkSymbol;
              payload: StellarSignTransaction;
          }
    );

export type TxSimulationMethod<M extends TxSimulationAction['method']> = Extract<
    TxSimulationAction,
    { method: M }
>;
