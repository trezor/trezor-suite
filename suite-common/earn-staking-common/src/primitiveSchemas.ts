import { z } from 'zod';

import type { NetworkSymbol } from '@trezor/network-module-types';

export const NETWORK_SYMBOL_PATTERN = /^[^:\s]+$/;

export const networkSymbolSchema = z.custom<NetworkSymbol>(
    value => typeof value === 'string' && NETWORK_SYMBOL_PATTERN.test(value),
    'Expected a network symbol',
);

export const timestampSchema = z.number().int().nonnegative();

export const FIRMWARE_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

export const firmwareVersionSchema = z
    .string()
    .regex(FIRMWARE_VERSION_PATTERN, 'Expected a firmware version as major.minor.patch');

export type FirmwareVersion = z.infer<typeof firmwareVersionSchema>;
