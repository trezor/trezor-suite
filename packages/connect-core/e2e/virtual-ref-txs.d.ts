declare module 'virtual:ref-txs' {
    import type { RefTransaction } from '@trezor/connect-common';

    export const REF_TXS: Record<string, RefTransaction>;
}
