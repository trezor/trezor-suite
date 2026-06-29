// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/cardanoInputs.js

import { DerivationPath } from '@trezor/connect-common';
import { MessagesSchema as PROTO } from '@trezor/protobuf';
import type { Static } from '@trezor/schema-utils';
import { Assert, Type } from '@trezor/schema-utils';

import { validatePath } from '../../utils/pathUtils';

export type Path = number[];
export const Path = Type.Array(Type.Number());

export type CollateralInputWithPath = {
    collateralInput: PROTO.CardanoTxCollateralInput;
    path?: Path;
};

export type InputWithPath = Static<typeof InputWithPath>;
export const InputWithPath = Type.Object({
    input: PROTO.CardanoTxInput,
    path: Type.Optional(Path),
});

export type InputWithPathParam = Static<typeof InputWithPath>;
export const InputWithPathParam = Type.Composite([
    PROTO.CardanoTxInput,
    Type.Object({
        path: Type.Optional(DerivationPath),
    }),
]);

export const transformInput = (input: unknown): InputWithPath => {
    Assert(InputWithPathParam, input);

    return {
        input: {
            prev_hash: input.prev_hash,
            prev_index: input.prev_index,
        },
        // Allow account-level (3-level) input paths so funds stranded on an address derived
        // from m/1852'/1815'/account' can be recovered. The device's safety_checks remain the
        // real safeguard: a non-standard witness path is rejected unless safety_checks is relaxed.
        path: input.path ? validatePath(input.path, 3) : undefined,
    };
};

export const transformCollateralInput = (collateralInput: unknown): CollateralInputWithPath => {
    Assert(InputWithPathParam, collateralInput);

    return {
        collateralInput: {
            prev_hash: collateralInput.prev_hash,
            prev_index: collateralInput.prev_index,
        },
        path: collateralInput.path ? validatePath(collateralInput.path, 5) : undefined,
    };
};

export const transformReferenceInput = (referenceInput: unknown): PROTO.CardanoTxReferenceInput => {
    Assert(PROTO.CardanoTxInput, referenceInput);

    return {
        prev_hash: referenceInput.prev_hash,
        prev_index: referenceInput.prev_index,
    };
};
