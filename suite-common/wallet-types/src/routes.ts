import { validateModalAppParams, validateWalletParams } from '@suite-common/suite-utils';

export type WalletParams = NonNullable<ReturnType<typeof validateWalletParams>>;
export type ModalAppParams = NonNullable<ReturnType<typeof validateModalAppParams>>;
