import type { NetworkSymbol } from '@trezor/network-module-types';

export type NetworkParams = {
    networks?: readonly NetworkSymbol[];
    isToken?: boolean;
};
