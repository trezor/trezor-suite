// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/tx/refTx.js

import type { CoinInfo, TransactionOptions } from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { isNotUndefined, unique } from '@trezor/utils';

type RefInput = Pick<PROTO.TxInputType, 'script_type' | 'prev_hash' | 'orig_hash'>;
type RefOutput = Pick<PROTO.TxOutputType, 'orig_hash'>;

export const getPreviousTxids = (
    inputs: RefInput[],
    { version }: Pick<TransactionOptions, 'version'> = {},
    { shortcut }: Partial<Pick<CoinInfo, 'shortcut'>> = {},
) => {
    // Referenced transactions are not required if:
    // - zcash tx version is NU5 (or greater)
    // - all internal inputs script_type === SPENDTAPROOT
    const prevRequired =
        shortcut === 'ZEC' || shortcut === 'TAZ'
            ? version && version < 5
            : inputs.some(
                  input => input.script_type !== 'SPENDTAPROOT' && input.script_type !== 'EXTERNAL',
              );

    return prevRequired
        ? unique(inputs.map(({ prev_hash }) => prev_hash).filter(isNotUndefined))
        : [];
};

export const getOriginalTxids = (inputs: RefInput[], outputs: RefOutput[]) =>
    unique([...inputs, ...outputs].map(({ orig_hash }) => orig_hash).filter(isNotUndefined));
