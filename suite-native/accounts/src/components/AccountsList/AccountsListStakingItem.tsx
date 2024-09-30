import { Account } from '@suite-common/wallet-types';
import { RoundedIcon } from '@suite-native/atoms';
import { CryptoAmountFormatter, CryptoToFiatAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';

import { AccountsListItemBase } from './AccountsListItemBase';

type AccountsListStakingItemProps = {
    account: Account;
    stakingCryptoBalance: string;
    onPress: () => void;

    hasBackground?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
};

export const AccountsListStakingItem = ({
    account,
    stakingCryptoBalance,
    isLast,
    ...props
}: AccountsListStakingItemProps) => {
    return (
        <AccountsListItemBase
            {...props}
            isLast={isLast}
            showDivider={!isLast}
            icon={<RoundedIcon name="piggyBankFilled" color="iconSubdued" />}
            title={<Translation id="accountList.staking" />}
            mainValue={
                <CryptoToFiatAmountFormatter
                    value={stakingCryptoBalance}
                    network={account.symbol}
                    isBalance
                />
            }
            secondaryValue={
                <CryptoAmountFormatter
                    value={stakingCryptoBalance}
                    network={account.symbol}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                />
            }
        />
    );
};
