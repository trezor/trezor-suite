import { ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { CryptoId } from 'invity-api';

import { ExtendedMessageDescriptor } from '@suite/intl';
import { AccountAddress } from '@trezor/connect';

import type { Account } from 'src/types/wallet';

export interface TradingVerifyFormProps {
    address?: string;
    extraField?: string;
}

export interface TradingVerifyAccountProps {
    cryptoId: CryptoId | undefined;
    nonSuiteAccount: boolean;
}

export interface TradingGetTranslationIdsProps {
    accountTooltipTranslationId: ExtendedMessageDescriptor['id'];
    addressTooltipTranslationId: ExtendedMessageDescriptor['id'];
}

export interface TradingVerifyAccountReturnProps {
    form: UseFormReturn<TradingVerifyFormProps>;
    accountAddress: AccountAddress | Pick<AccountAddress, 'path' | 'address'> | undefined;
    receiveNetwork: CryptoId | undefined;
    suiteReceiveAccounts: Account[] | undefined;
    selectedAccount: Account | null | undefined;
    canAddSuiteAccount: boolean;
    canUseNonSuiteAccount: boolean;
    isMenuOpen: boolean | undefined;
    getTranslationIds: (
        selectedAccount: Account | null | undefined,
    ) => TradingGetTranslationIdsProps;
    onChangeAccount: (account: Account) => void;
    selectNonSuiteAddress: (address?: string) => void;
    openAddSuiteAccount: () => void;
}

export type TradingVerifyOptionsProps = {
    receiveNetwork: CryptoId;
    label: ReactNode;
    isDisabled?: boolean;
} & Pick<
    TradingVerifyAccountReturnProps,
    | 'suiteReceiveAccounts'
    | 'selectedAccount'
    | 'canAddSuiteAccount'
    | 'canUseNonSuiteAccount'
    | 'onChangeAccount'
    | 'selectNonSuiteAddress'
    | 'openAddSuiteAccount'
    | 'isMenuOpen'
>;
