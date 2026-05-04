import {
    type Mnemonic,
    OwnerSecret,
    createSlip21,
    hexToBytes,
    ownerSecretToMnemonic,
} from '@evolu/common';

import { type SuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { type Result, err, ok } from '@trezor/type-utils';

export const SPARK_MNEMONIC_DERIVATION_PATH = ['TrezorSuite', 'Spark', 'Mnemonic'] as const;

export type SparkMnemonicDerivationError =
    | {
          type: 'InvalidSuiteSyncOwnerSecretHex';
      }
    | {
          type: 'InvalidSuiteSyncOwnerEntropy';
      }
    | {
          type: 'InvalidSparkMnemonicEntropy';
      };

const suiteSyncOwnerSecretHexToOwnerSecret = (
    ownerSecretHex: SuiteSyncOwnerSecretHex,
): Result<OwnerSecret, SparkMnemonicDerivationError> => {
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

export const deriveSparkMnemonicFromSuiteSyncSecret = (
    ownerSecretHex: SuiteSyncOwnerSecretHex,
): Result<Mnemonic, SparkMnemonicDerivationError> => {
    const ownerSecret = suiteSyncOwnerSecretHexToOwnerSecret(ownerSecretHex);

    if (!ownerSecret.success) {
        return ownerSecret;
    }

    const sparkEntropy = OwnerSecret.from(
        createSlip21(ownerSecret.payload, [...SPARK_MNEMONIC_DERIVATION_PATH]),
    );

    if (!sparkEntropy.ok) {
        return err({ type: 'InvalidSparkMnemonicEntropy' });
    }

    return ok(ownerSecretToMnemonic(sparkEntropy.value));
};
