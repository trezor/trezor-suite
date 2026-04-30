import { type SuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { type Result, err, ok } from '@trezor/type-utils';

import { deriveSparkMnemonicFromSuiteSyncSecret } from '../wallet/sparkMnemonic';

export type SparkWalletClientError =
    | {
          type: 'SparkMnemonicDerivationFailed';
          message: string;
      }
    | {
          type: 'SparkWalletInitializationFailed';
          message: string;
      }
    | {
          type: 'SparkWalletOperationFailed';
          message: string;
      };

export const getSparkWalletMnemonic = (
    ownerSecret: SuiteSyncOwnerSecretHex,
): Result<string, SparkWalletClientError> => {
    const mnemonic = deriveSparkMnemonicFromSuiteSyncSecret(ownerSecret);

    if (!mnemonic.success) {
        return err({
            type: 'SparkMnemonicDerivationFailed',
            message: mnemonic.error.type,
        });
    }

    return ok(mnemonic.payload);
};
