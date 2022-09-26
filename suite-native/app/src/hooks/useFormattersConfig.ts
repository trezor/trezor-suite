import { FormatterProviderConfig } from '@suite-common/formatters';
import { PROTO } from '@trezor/connect';

export const useFormattersConfig = (): FormatterProviderConfig => ({
    locale: 'en',
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
});
