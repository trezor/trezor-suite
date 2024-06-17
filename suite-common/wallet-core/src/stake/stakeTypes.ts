import { UseFormReturn, FormState as ReactHookFormState } from 'react-hook-form';

import { Network, NetworkSymbol, getNetworkFeatures } from '@suite-common/wallet-config';
import {
    Account,
    Rate,
    FeeInfo,
    StakeFormState,
    PrecomposedLevels,
} from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { FeeLevel } from '@trezor/connect';

// Used when Everstake pool stats are not available from the API.
export const BACKUP_ETH_APY = 4.13;

export const supportedNetworkSymbols = ['eth', 'thol'] as const;

export type SupportedNetworkSymbol = (typeof supportedNetworkSymbols)[number];

export function isSupportedEthStakingNetworkSymbol(
    networkSymbols: NetworkSymbol,
): networkSymbols is SupportedNetworkSymbol {
    return (supportedNetworkSymbols as readonly string[]).includes(networkSymbols);
}

export const getStakingSymbols = (networkSymbols: NetworkSymbol[]) =>
    networkSymbols.reduce((acc, networkSymbol) => {
        if (
            isSupportedEthStakingNetworkSymbol(networkSymbol) &&
            getNetworkFeatures(networkSymbol).includes('staking')
        ) {
            acc.push(networkSymbol);
        }

        return acc;
    }, [] as SupportedNetworkSymbol[]);

export const EVERSTAKE_ENDPOINT_PREFIX: Record<SupportedNetworkSymbol, string> = {
    eth: 'https://eth-api-b2c.everstake.one/api/v1',
    thol: 'https://eth-api-b2c-stage.everstake.one/api/v1',
};

export enum EverstakeEndpointType {
    PoolStats = 'poolStats',
    ValidatorsQueue = 'validatorsQueue',
}

export const EVERSTAKE_ENDPOINT_TYPES = {
    [EverstakeEndpointType.PoolStats]: 'stats',
    [EverstakeEndpointType.ValidatorsQueue]: 'validators/queue',
};

export interface ValidatorsQueue {
    validatorsEnteringNum?: number;
    validatorsExitingNum?: number;
    validatorsTotalCount?: number;
    validatorsPerEpoch?: number;
    validatorActivationTime?: number;
    validatorExitTime?: number;
    validatorWithdrawTime?: number;
    validatorAddingDelay?: number;
    updatedAt?: number;
}

export interface AmountLimitsString {
    currency: string;
    minCrypto?: string;
    maxCrypto?: string;
    minFiat?: string;
    maxFiat?: string;
}

export interface BaseStakeContextValues {
    account: Account;
    network: Network;
    localCurrency: FiatCurrencyCode;
    composedLevels?: PrecomposedLevels;
    isComposing: boolean;
    clearForm: () => void;
    signTx: () => Promise<void>;
    selectedFee: FeeLevel['label'];
    feeInfo: FeeInfo;
    changeFeeLevel: (level: FeeLevel['label']) => void;
}

export type StakeContextValues = UseFormReturn<StakeFormState> &
    BaseStakeContextValues & {
        formState: ReactHookFormState<StakeFormState>;
        removeDraft: (key: string) => void;
        isDraft: boolean;
        amountLimits: AmountLimitsString;
        isAmountForWithdrawalWarningShown: boolean;
        isAdviceForWithdrawalWarningShown: boolean;
        isConfirmModalOpen: boolean;
        onCryptoAmountChange: (amount: string) => void;
        onFiatAmountChange: (amount: string) => void;
        setMax: () => void;
        setRatioAmount: (divisor: number) => void;
        closeConfirmModal: () => void;
        onSubmit: () => void;
        currentRate: Rate | undefined;
        isLoading: boolean;
    };

export interface UnstakeFormState extends Omit<StakeFormState, 'setMaxOutputId'> {}

export type UnstakeContextValues = UseFormReturn<UnstakeFormState> &
    BaseStakeContextValues & {
        formState: ReactHookFormState<StakeFormState>;
        onCryptoAmountChange: (amount: string) => Promise<void>;
        onFiatAmountChange: (amount: string) => void;
        onOptionChange: (amount: string) => Promise<void>;
        currentRate: Rate | undefined;
    };
