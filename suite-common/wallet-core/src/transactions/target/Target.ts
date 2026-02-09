import { TxOutputId } from '@suite-common/wallet-types';
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
    targetId: TxOutputId;
    payload: Transaction['targets'][number];
};

export type TokenTarget = {
    type: 'token';
    targetId: TxOutputId;
    payload: TokenTransferType;
};

export type InternalTarget = {
    type: 'internal';
    targetId: TxOutputId;
    payload: InternalTransferType;
};

export type Target = SimpleTarget | TokenTarget | InternalTarget;
