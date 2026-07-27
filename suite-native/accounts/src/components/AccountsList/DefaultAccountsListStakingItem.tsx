import { type Account } from '@suite-common/wallet-types';
import { RoundedIcon } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import { AccountsListItemBase } from './AccountsListItemBase';

type DefaultAccountsListStakingItemProps = {
    account: Account;
    stakingCryptoBalance: string;
    onPress: () => void;

    hasBackground?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
};

export const DefaultAccountsListStakingItem = ({
    account,
    stakingCryptoBalance,
    isLast,
    ...props
}: DefaultAccountsListStakingItemProps) => (
    <AccountsListItemBase
        {...props}
        isLast={isLast}
        showDivider={!isLast}
        icon={<RoundedIcon name="piggyBankFilled" intent="neutral" size={32} />}
        title={<Translation id="accountList.staking" />}
        mainValue={
            <CryptoToFiatAmountFormatter
                value={stakingCryptoBalance}
                symbol={account.symbol}
                isBalance
            />
        }
        secondaryValue={
            <CryptoAmountFormatter
                value={stakingCryptoBalance}
                symbol={account.symbol}
                numberOfLines={1}
                adjustsFontSizeToFit
            />
        }
    />
);
