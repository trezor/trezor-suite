import {
    type Mnemonic,
    OwnerSecret,
    createSlip21,
    hexToBytes,
    ownerSecretToMnemonic,
} from '@evolu/common';

import { type SuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { type Result, err, ok } from '@trezor/type-utils';

export const ARK_MNEMONIC_DERIVATION_PATH = ['TrezorSuite', 'Ark', 'Mnemonic'] as const;

export type ArkMnemonicDerivationError =
    | {
          type: 'InvalidSuiteSyncOwnerSecretHex';
      }
    | {
          type: 'InvalidSuiteSyncOwnerEntropy';
      }
    | {
          type: 'InvalidArkMnemonicEntropy';
      };

const suiteSyncOwnerSecretHexToOwnerSecret = (
    ownerSecretHex: SuiteSyncOwnerSecretHex,
): Result<OwnerSecret, ArkMnemonicDerivationError> => {
    let ownerSecretBytes: Uint8Array;

    try {
        ownerSecretBytes = hexToBytes(ownerSecretHex).slice(0, 32);
    } catch {
        return err({ type: 'InvalidSuiteSyncOwnerSecretHex' });
    }

    const ownerSecret = OwnerSecret.from(ownerSecretBytes);

    if (!ownerSecret.ok) {
        return err({ type: 'InvalidSuiteSyncOwnerEntropy' });
    }

    return ok(ownerSecret.value);
};

export const deriveArkMnemonicFromSuiteSyncSecret = (
    ownerSecretHex: SuiteSyncOwnerSecretHex,
): Result<Mnemonic, ArkMnemonicDerivationError> => {
    const ownerSecret = suiteSyncOwnerSecretHexToOwnerSecret(ownerSecretHex);

    if (!ownerSecret.success) {
        return ownerSecret;
    }

    const arkEntropy = OwnerSecret.from(
        createSlip21(ownerSecret.payload, [...ARK_MNEMONIC_DERIVATION_PATH]),
    );

    if (!arkEntropy.ok) {
        return err({ type: 'InvalidArkMnemonicEntropy' });
    }

    return ok(ownerSecretToMnemonic(arkEntropy.value));
};
