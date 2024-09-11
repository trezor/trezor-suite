import type { Account } from 'src/types/wallet';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { CryptoId } from 'invity-api';
import { UseFormReturn } from 'react-hook-form';
import { AccountAddress } from '@trezor/connect';
import { ExtendedMessageDescriptor, TrezorDevice } from 'src/types/suite';

export interface CoinmarketVerifyFormProps {
    address?: string;
    extraField?: string;
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

export type CoinmarketVerifyOptionsProps = { receiveNetwork: CryptoId } & Pick<
    CoinmarketVerifyAccountReturnProps,
    'selectAccountOptions' | 'selectedAccountOption' | 'onChangeAccount' | 'isMenuOpen'
>;

export interface CoinmarketVerifyOptionsItemProps {
    option: CoinmarketVerifyFormAccountOptionProps;
    receiveNetwork: CryptoId;
}

export interface CoinmarketGetSuiteReceiveAccountsProps {
    currency: CryptoId | undefined;
    device: TrezorDevice | undefined;
    receiveNetwork: NetworkSymbol | undefined;
    isDebug: boolean;
    accounts: Account[];
}
