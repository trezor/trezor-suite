import { type UseFormReturn } from 'react-hook-form';

import { type BaseStakeContextValues, type StakeFormState } from '@suite-common/wallet-types';

export type ClaimFormState = Omit<
    StakeFormState,
    'amountLimits' | 'onCryptoAmountChange' | 'onFiatAmountChange' | 'setMaxOutputId' | 'fiatInput'
>;

export type ClaimContextValues = UseFormReturn<ClaimFormState> &
    BaseStakeContextValues & {
        hasComposeError: boolean;
        retryCompose: () => Promise<void>;
        onClaimChange: (amount: string) => Promise<void>;
    } & {
        methods: UseFormReturn<ClaimFormState>;
        isClaimingDisabled?: boolean;
    };
