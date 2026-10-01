/**
 * An extra input a network's send form has besides address and amount, declared as data so every
 * platform renders and validates it the same way. The platform supplies the input component; the
 * rule lives here, next to the declaration.
 */
export type SendFieldDeclaration = {
    readonly id: string;
    readonly kind: 'text' | 'uint32';
    readonly limit?: {
        /** UTF-8 byte length limit for `text` fields; chains count bytes, not characters. */
        readonly bytes?: number;
    };
};

export type SendFieldValidationError = 'too-long' | 'not-a-number' | 'out-of-range';

const UINT32_MAX = 4_294_967_295;

const getUtf8ByteLength = (value: string): number => new TextEncoder().encode(value).length;

/** The one validation rule for a declared field; an empty value is always valid (fields are optional). */
export const validateSendField = (
    declaration: SendFieldDeclaration,
    value: string,
): SendFieldValidationError | undefined => {
    if (value === '') {
        return undefined;
    }

    switch (declaration.kind) {
        case 'text': {
            const bytes = declaration.limit?.bytes;

            return bytes !== undefined && getUtf8ByteLength(value) > bytes ? 'too-long' : undefined;
        }
        case 'uint32': {
            if (!/^\d+$/.test(value)) {
                return 'not-a-number';
            }

            return Number(value) > UINT32_MAX ? 'out-of-range' : undefined;
        }
    }
};
