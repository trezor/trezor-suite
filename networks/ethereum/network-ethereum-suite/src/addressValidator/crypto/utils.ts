import sha3 from './sha3';

// @ts-expect-error: indexing with noUncheckedIndexedAccess
const keccak256Fn: (data: string) => string = (
    sha3 as unknown as Record<string, (data: string) => string>
)['keccak256'];

export function keccak256(hexString: string): string {
    return keccak256Fn(hexString);
}
