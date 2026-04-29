import TrezorConnect from '@trezor/connect';

/**
 *
 * @param value - ENS name or other TLD name.
 * @returns The resolved address or the original value if it's a valid address.
 */
export const resolveViaBlockbook = async (value: string) => {
    const result = await TrezorConnect.getAddress({
        address: value,
        path: [],
    });

    if (!result.success) {
        throw new Error(result.error.message);
    }

    return result.payload.address;
};
