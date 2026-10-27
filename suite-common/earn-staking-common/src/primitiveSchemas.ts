import { z } from 'zod';

import type { NetworkSymbol } from '@trezor/network-module-types';

const NETWORK_SYMBOL_PATTERN = /^[^:\s]+$/;

export const networkSymbolSchema = z.custom<NetworkSymbol>(
    value => typeof value === 'string' && NETWORK_SYMBOL_PATTERN.test(value),
    'Expected a network symbol',
);

export const timestampSchema = z.number().int().nonnegative();
