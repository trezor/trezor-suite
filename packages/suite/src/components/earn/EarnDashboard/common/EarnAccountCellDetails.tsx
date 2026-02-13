import { NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { Text } from '@trezor/components';

import { AccountLabel, FormattedCryptoAmount } from 'src/components/suite';

import { EarnTokenBalance } from './types';

type EarnAccountCellDetailsProps = {
    account?: Account;
    networkSymbol: NetworkSymbol;
    tokenBalance?: EarnTokenBalance;
};

export const EarnAccountCellDetails = ({
    account,
    networkSymbol,
    tokenBalance,
}: EarnAccountCellDetailsProps) => {
    if (!account) {
        return (
            <Text
                typographyStyle="body-sm"
                intent="neutral"
                priority="primary"
                ellipsisLineCount={1}
                maxWidth="100%"
            >
                {getNetwork(networkSymbol).name}
            </Text>
        );
    }

    return (
        <>
            <AccountLabel
                account={account}
                showAccountTypeBadge
                accountTypeBadgeSize="small"
                intent="neutral"
                priority="primary"
                typographyStyle="body-sm"
            />

            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                {tokenBalance ? (
                    <FormattedCryptoAmount
                        value={tokenBalance.value}
                        symbol={tokenBalance.symbol}
                        contractAddress={tokenBalance.contractAddress}
                        isBalance
                    />
                ) : (
                    <FormattedCryptoAmount
                        value={account.formattedBalance}
                        symbol={networkSymbol}
                        isBalance
                    />
                )}
            </Text>
        </>
    );
};
