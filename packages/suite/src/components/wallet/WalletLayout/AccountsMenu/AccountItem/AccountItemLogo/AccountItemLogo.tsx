import { Column, Icon } from '@trezor/components';
import { PiggyBankFilledIcon } from '@trezor/icons';
import { TokenLogo } from '@trezor/product-components';
import { exhaustive } from '@trezor/type-utils';

import { TokenIconSetWrapper } from 'src/components/wallet/TokenIconSetWrapper';
import { type Account, type AccountItemType } from 'src/types/wallet';

type AccountItemLogoProps = {
    type: AccountItemType;
    account: Account;
};

export const AccountItemLogo = ({ type, account }: AccountItemLogoProps) => {
    switch (type) {
        case 'coin':
            return (
                <Column alignItems="center">
                    <TokenLogo symbol={account.symbol} size={24} />
                </Column>
            );

        case 'staking':
            return <Icon as={PiggyBankFilledIcon} intent="neutral" priority="secondary" />;

        case 'tokens':
            return <TokenIconSetWrapper accounts={[account]} symbol={account.symbol} />;

        default:
            return exhaustive(type);
    }
};
