import { type Address, getAddress, isAddress } from 'viem';

import { type Result, err, ok } from '@trezor/type-utils';

export type EthereumDestination = {
    /** EIP-55 checksummed form. This is what the page shows; its 20 bytes go to the device. */
    address: Address;
};

export type EthereumDestinationError =
    | { type: 'empty' }
    | { type: 'invalid' }
    /** Mixed-case input whose capitalisation is not a valid EIP-55 checksum: a typo somewhere. */
    | { type: 'bad-checksum' }
    | { type: 'own-address' };

export type ValidateEthereumDestinationParams = {
    input: string;
    /** Lowercase addresses known to belong to the scanned wallet. */
    ownAddresses: ReadonlySet<string>;
};

/**
 * Validates the address the funds are swept to. An all-lowercase address carries no checksum and
 * is accepted as typed; a mixed-case one must pass the EIP-55 check, which catches a mistyped
 * character. The address must not be one of the scanned addresses of the wallet being emptied.
 */
export const validateEthereumDestination = ({
    input,
    ownAddresses,
}: ValidateEthereumDestinationParams): Result<EthereumDestination, EthereumDestinationError> => {
    const trimmed = input.trim();
    if (trimmed === '') return err({ type: 'empty' });

    if (!isAddress(trimmed, { strict: false })) return err({ type: 'invalid' });
    if (!isAddress(trimmed, { strict: true })) return err({ type: 'bad-checksum' });

    if (ownAddresses.has(trimmed.toLowerCase())) return err({ type: 'own-address' });

    return ok({ address: getAddress(trimmed) });
};

/** The 20 address bytes as hex without the `0x` prefix, the way the legacy message carries them. */
export const getEthereumAddressBytes = (address: Address) => address.slice(2).toLowerCase();
