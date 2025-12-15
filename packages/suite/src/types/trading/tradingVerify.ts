import type { ReactNode } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import type { CryptoId } from 'invity-api';

import type { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import type { AccountAddress } from '@trezor/connect';

import type { Account } from 'src/types/wallet';

export interface TradingVerifyFormProps {
    address?: string;
    extraField?: string;
}

export type TradingAccountType = 'SUITE' | 'ADD_SUITE' | 'NON_SUITE';
export interface TradingVerifyFormAccountOptionProps {
    type: TradingAccountType;
    account?: Account;
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
    selectAccountOptions: TradingVerifyFormAccountOptionProps[];
    selectedAccountOption?: TradingVerifyFormAccountOptionProps;
    isMenuOpen: boolean | undefined;
    getTranslationIds: (
        type: TradingVerifyFormAccountOptionProps['type'] | undefined,
    ) => TradingGetTranslationIdsProps;
    onChangeAccount: (account: TradingVerifyFormAccountOptionProps) => void;
}

export type TradingVerifyOptionsProps = {
    receiveNetwork: CryptoId;
    label: ReactNode;
    isDisabled?: boolean;
} & Pick<
    TradingVerifyAccountReturnProps,
    'selectAccountOptions' | 'selectedAccountOption' | 'onChangeAccount' | 'isMenuOpen'
>;

export interface TradingVerifyOptionsItemProps {
    option: TradingVerifyFormAccountOptionProps;
    receiveNetwork: CryptoId;
}
