import { type Result, err, ok } from '@trezor/type-utils';

import { toHardenedPathPart } from './hardened';

type GetHDPathError = { type: 'PATH_NOT_VALID' } | { type: 'PATH_NEGATIVE_VALUES' };

export const getHDPath = (path: string): Result<number[], GetHDPathError> => {
    const parts = path.toLowerCase().split('/');

    if (parts[0] !== 'm') {
        return err({ type: 'PATH_NOT_VALID' as const });
    }

    const result: number[] = [];

    const filteredParts = parts.filter(part => part !== 'm' && part !== '');

    for (let part of filteredParts) {
        let hardened = false;

        if (part.endsWith("'")) {
            hardened = true;
            part = part.substring(0, part.length - 1);
        }

        let n = parseInt(part, 10);

        if (Number.isNaN(n)) {
            return err({ type: 'PATH_NOT_VALID' as const });
        } else if (n < 0) {
            return err({ type: 'PATH_NEGATIVE_VALUES' as const });
        }

        if (hardened) {
            // hardened index
            n = toHardenedPathPart(n);
        }

        result.push(n);
    }

    return ok(result);
};
