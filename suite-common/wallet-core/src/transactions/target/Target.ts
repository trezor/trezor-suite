import { TxTargetId } from '@suite-common/wallet-types';
import {
    InternalTransfer as InternalTransferType,
    TokenTransfer as TokenTransferType,
    Transaction,
} from '@trezor/blockchain-link-types';

/**
 * Classic utxo-based (bitcoin-like) networks
 */
export type SimpleTarget = {
    type: 'target';
    targetId: TxTargetId;
    payload: Transaction['targets'][number];
};

export type TokenTarget = {
    type: 'token';
    targetId: TxTargetId;
    payload: TokenTransferType;
};

export type InternalTarget = {
    type: 'internal';
    targetId: TxTargetId;
    payload: InternalTransferType;
};

export type Target = SimpleTarget | TokenTarget | InternalTarget;
