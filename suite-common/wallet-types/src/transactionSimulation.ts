import type {
    EthereumSignTransaction,
    EthereumSignTypedData,
    EthereumSignTypedDataTypes,
} from '@trezor/connect';

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
    );

export type TxSimulationMethod<M extends TxSimulationAction['method']> = Extract<
    TxSimulationAction,
    { method: M }
>;
