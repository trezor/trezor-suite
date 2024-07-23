import type { Account, NetworkSymbol } from 'src/types/wallet';
import { CryptoSymbol } from 'invity-api';
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
    currency: CryptoSymbol | undefined;
}

export interface CoinmarketGetTranslationIdsProps {
    accountTooltipTranslationId: ExtendedMessageDescriptor['id'];
    addressTooltipTranslationId: ExtendedMessageDescriptor['id'];
}

export interface CoinmarketVerifyAccountReturnProps {
    form: UseFormReturn<CoinmarketVerifyFormProps>;
    accountAddress: AccountAddress | Pick<AccountAddress, 'path' | 'address'> | undefined;
    receiveNetwork: NetworkSymbol | undefined;
    selectAccountOptions: CoinmarketVerifyFormAccountOptionProps[];
    selectedAccountOption?: CoinmarketVerifyFormAccountOptionProps;
    getTranslationIds: (
        type: CoinmarketVerifyFormAccountOptionProps['type'] | undefined,
    ) => CoinmarketGetTranslationIdsProps;
    onChangeAccount: (account: CoinmarketVerifyFormAccountOptionProps) => void;
}

export type CoinmarketSelectedOfferVerifyOptionsProps = Pick<
    CoinmarketVerifyAccountReturnProps,
    'receiveNetwork' | 'selectAccountOptions' | 'selectedAccountOption' | 'onChangeAccount'
>;

export interface CoinmarketGetSuiteReceiveAccountsProps {
    currency: CryptoSymbol | undefined;
    device: TrezorDevice | undefined;
    receiveNetwork: NetworkSymbol | undefined;
    isDebug: boolean;
    accounts: Account[];
}
