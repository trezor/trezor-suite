import { Column, Icon } from '@trezor/components';
import { PiggyBankFilledIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';
import { exhaustive } from '@trezor/type-utils';

import { type Account, type AccountItemType } from '../../../../../../types/wallet';
import { TokenIconSetWrapper } from '../../../../TokenIconSetWrapper';

type AccountItemLogoProps = {
    type: AccountItemType;
    account: Account;
};

export const AccountItemLogo = ({ type, account }: AccountItemLogoProps) => {
    switch (type) {
        case 'coin':
            return (
                <Column alignItems="center">
                    <TokenIcon size={24} symbol={account.symbol} />
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
