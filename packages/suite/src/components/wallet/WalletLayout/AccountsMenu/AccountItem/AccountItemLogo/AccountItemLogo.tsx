import { Column, Icon } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
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
                    <CoinLogo size={24} symbol={account.symbol} />
                </Column>
            );

        case 'staking':
            return <Icon name="piggyBankFilled" intent="neutral" priority="secondary" />;

        case 'tokens':
            return <TokenIconSetWrapper accounts={[account]} symbol={account.symbol} />;

        default:
            return exhaustive(type);
    }
};
