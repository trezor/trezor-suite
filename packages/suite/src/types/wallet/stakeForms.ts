import type { SelectedAccountLoaded } from '@suite-common/wallet-types';

export const FIAT_INPUT = 'fiatInput';
export const CRYPTO_INPUT = 'cryptoInput';
export const OUTPUT_AMOUNT = 'outputs.0.amount';

export type UseStakeFormsProps = { selectedAccount: SelectedAccountLoaded };
