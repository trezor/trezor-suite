import { UseFormReturn } from 'react-hook-form';
import {
    Account,
    FormState,
    PrecomposedLevels,
    PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';
import { Network } from './index';
import { FormState as ReactHookFormState } from 'react-hook-form/dist/types/form';
import { AmountLimits } from './coinmarketCommonTypes';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { WithSelectedAccountLoadedProps } from '../../components/wallet';
import { FeeLevel } from '@trezor/connect';

export const FIAT_INPUT = 'fiatInput';
export const CRYPTO_INPUT = 'cryptoInput';
export const OUTPUT_AMOUNT = 'outputs.0.amount';

export type UseStakeEthFormProps = WithSelectedAccountLoadedProps;

export interface StakeEthFormState extends FormState {
    fiatInput?: string;
    cryptoInput?: string;
}

export type StakeEthContextValues = UseFormReturn<StakeEthFormState> & {
    onSubmit: () => void;
    account: Account;
    network: Network;
    cryptoInputValue?: string;
    removeDraft: (key: string) => void;
    formState: ReactHookFormState<StakeEthFormState>;
    isDraft: boolean;
    amountLimits: AmountLimits;
    onCryptoAmountChange: (amount: string) => void;
    onFiatAmountChange: (amount: string) => void;
    localCurrency: FiatCurrencyCode;
    composedLevels?: PrecomposedLevels | PrecomposedLevelsCardano;
    isComposing: boolean;
    setMax: () => void;
    setRatioAmount: (divisor: number) => void;
    isAmountForWithdrawalWarningShown: boolean;
    isAdviceForWithdrawalWarningShown: boolean;
    // TODO: Implement fee switcher
    selectedFee: FeeLevel['label'];
    clearForm: () => void;
};
