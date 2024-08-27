import type { Account, NetworkSymbol } from 'src/types/wallet';
import { CryptoId } from 'invity-api';
import { UseFormReturn } from 'react-hook-form';
import { AccountAddress } from '@trezor/connect';
import { ExtendedMessageDescriptor, TrezorDevice } from 'src/types/suite';

export interface CoinmarketVerifyFormProps {
    address?: string;
}

export type CoinmarketAccountType = 'SUITE' | 'ADD_SUITE' | 'NON_SUITE';
export interface CoinmarketVerifyFormAccountOptionProps {
    type: CoinmarketAccountType;
    account?: Account;
}

export interface CoinmarketVerifyAccountProps {
    currency: CryptoId | undefined;
}

export interface CoinmarketGetTranslationIdsProps {
    accountTooltipTranslationId: ExtendedMessageDescriptor['id'];
    addressTooltipTranslationId: ExtendedMessageDescriptor['id'];
}

export interface CoinmarketVerifyAccountReturnProps {
    form: UseFormReturn<CoinmarketVerifyFormProps>;
    accountAddress: AccountAddress | Pick<AccountAddress, 'path' | 'address'> | undefined;
    receiveNetwork: CryptoId | undefined;
    selectAccountOptions: CoinmarketVerifyFormAccountOptionProps[];
    selectedAccountOption?: CoinmarketVerifyFormAccountOptionProps;
    isMenuOpen: boolean | undefined;
    getTranslationIds: (
        type: CoinmarketVerifyFormAccountOptionProps['type'] | undefined,
    ) => CoinmarketGetTranslationIdsProps;
    onChangeAccount: (account: CoinmarketVerifyFormAccountOptionProps) => void;
}

export type CoinmarketSelectedOfferVerifyOptionsProps = Pick<
    CoinmarketVerifyAccountReturnProps,
    | 'receiveNetwork'
    | 'selectAccountOptions'
    | 'selectedAccountOption'
    | 'onChangeAccount'
    | 'isMenuOpen'
>;

export interface CoinmarketSelectedOfferVerifyOptionsItemProps {
    option: CoinmarketVerifyFormAccountOptionProps;
    receiveNetwork: CryptoId | undefined;
}

export interface CoinmarketGetSuiteReceiveAccountsProps {
    currency: CryptoId | undefined;
    device: TrezorDevice | undefined;
    receiveNetwork: NetworkSymbol | undefined;
    isDebug: boolean;
    accounts: Account[];
}
