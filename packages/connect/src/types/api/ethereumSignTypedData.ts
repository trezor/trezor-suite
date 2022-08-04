import type { PROTO } from '../../constants';
import type { Params, Response } from '../params';
import type {
    EthereumSignTypedDataTypes,
    EthereumSignTypedData,
    EthereumSignTypedHash,
} from './ethereum';

export declare function ethereumSignTypedData<T extends EthereumSignTypedDataTypes>(
    params: Params<EthereumSignTypedData<T>>,
): Response<PROTO.EthereumTypedDataSignature>;
export declare function ethereumSignTypedData<T extends EthereumSignTypedDataTypes>(
    params: Params<EthereumSignTypedHash<T>>,
): Response<PROTO.EthereumTypedDataSignature>;
