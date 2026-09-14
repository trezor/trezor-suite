import {
    type BrandWithoutRefineError,
    type LengthError,
    type MaxLengthError,
    type MinLengthError,
    type NullError,
    type ObjectError,
    type UnionError,
} from '@evolu/common';

import { describeEvoluTypeError } from './describeEvoluTypeError';

const LABEL = 'Savings for the house';
const XPUB =
    'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz';

describe(describeEvoluTypeError.name, () => {
    it('keeps the discriminator path of an object error and drops the rejected row', () => {
        const error: ObjectError<{ label: MaxLengthError; accountDescriptor: MinLengthError }> = {
            type: 'Object',
            value: { accountDescriptor: XPUB, networkSymbol: 'btc', label: LABEL },
            reason: {
                kind: 'Props',
                errors: {
                    label: { type: 'MaxLength', value: LABEL, max: 1000 },
                    accountDescriptor: { type: 'MinLength', value: '', min: 1 },
                },
            },
        };

        const description = describeEvoluTypeError(error);

        expect(description).toBe('Object.Props.label.MaxLength,accountDescriptor.MinLength');
        expect(description).not.toContain(LABEL);
        expect(description).not.toContain(XPUB);
    });

    it('follows brand parent errors', () => {
        const error: BrandWithoutRefineError<'OwnerSecret', LengthError> = {
            type: 'OwnerSecret',
            value: new Uint8Array([222, 173]),
            parentError: { type: 'Length', value: new Uint8Array([222, 173]), exact: 32 },
        };

        expect(describeEvoluTypeError(error)).toBe('OwnerSecret.Length');
    });

    it('lists the members of a union error', () => {
        const error: UnionError<NullError | MaxLengthError> = {
            type: 'Union',
            value: LABEL,
            errors: [
                { type: 'Null', value: LABEL },
                { type: 'MaxLength', value: LABEL, max: 1000 },
            ],
        };

        expect(describeEvoluTypeError(error)).toBe('Union.Null,MaxLength');
    });

    it('describes a reason without nested errors', () => {
        const error: ObjectError = {
            type: 'Object',
            value: XPUB,
            reason: { kind: 'NotObject' },
        };

        expect(describeEvoluTypeError(error)).toBe('Object.NotObject');
    });
});
