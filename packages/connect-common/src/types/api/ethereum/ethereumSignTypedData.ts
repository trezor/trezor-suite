import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type {
    EthereumSignTypedData,
    EthereumSignTypedDataTypes,
    EthereumSignTypedHash,
} from './common';
import type { Params, Response } from '../../params';

export declare function ethereumSignTypedData<T extends EthereumSignTypedDataTypes>(
    params: Params<EthereumSignTypedData<T>>,
): Response<PROTO.EthereumTypedDataSignature>;
export declare function ethereumSignTypedData<T extends EthereumSignTypedDataTypes>(
    params: Params<EthereumSignTypedHash<T>>,
): Response<PROTO.EthereumTypedDataSignature>;
