import { isAddress } from 'viem';

import { type EvmAddress } from '../../types/evm';
import { type ContextWith } from '../../types/validation';
import { type InspectFn, type ValidateFn, createValidator } from '../createValidator';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as EvmAddress;

export const isValidAddress: ValidateFn<string> = input =>
    isAddress(input, { strict: false }) ? null : 'INVALID_ADDRESS';

export const isZeroAddress: InspectFn<EvmAddress> = value =>
    value === ZERO_ADDRESS ? 'ZERO_ADDRESS' : null;

type SenderContext = ContextWith<{ sender?: EvmAddress }>;

export const isSameAsSender: InspectFn<EvmAddress, SenderContext> = (value, context) =>
    context?.sender && value.toLowerCase() === context.sender.toLowerCase() ? 'SELF_ADDRESS' : null;

export const isNotSameAsSender: InspectFn<EvmAddress, SenderContext> = (value, context) =>
    context?.sender && value.toLowerCase() !== context.sender.toLowerCase()
        ? 'NOT_SAME_AS_SENDER'
        : null;

type WhitelistContext = ContextWith<{ addressWhitelist?: EvmAddress[] }>;

export const isNotWhitelisted: InspectFn<EvmAddress, WhitelistContext> = (value, context) =>
    context?.addressWhitelist &&
    !context.addressWhitelist.some(addr => addr.toLowerCase() === value.toLowerCase())
        ? 'ADDRESS_NOT_WHITELISTED'
        : null;

export const validateAddress = createValidator<
    string,
    EvmAddress,
    SenderContext & WhitelistContext
>({
    validate: [isValidAddress],
    normalize: (input: string) => input.toLowerCase() as EvmAddress,
    inspect: [isZeroAddress, isSameAsSender, isNotSameAsSender, isNotWhitelisted],
});
