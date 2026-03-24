import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Text } from '@trezor/components';

import { AccountLabel, FormattedCryptoAmount } from 'src/components/suite';

import { type EarnTokenBalance } from './types';

type EarnAccountCellDetailsProps = {
    account?: Account;
    networkSymbol: NetworkSymbol;
    tokenBalance?: EarnTokenBalance;
    subtitle?: string;
};

export const EarnAccountCellDetails = ({
    account,
    networkSymbol,
    tokenBalance,
    subtitle,
}: EarnAccountCellDetailsProps) => {
    if (!account) {
        return (
            <>
                <Text
                    typographyStyle="body-sm"
                    intent="neutral"
                    priority="primary"
                    ellipsisLineCount={1}
                    maxWidth="100%"
                >
                    {getNetwork(networkSymbol).name}
                </Text>

                {subtitle && (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        {subtitle}
                    </Text>
                )}
            </>
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

            {subtitle ? (
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    {subtitle}
                </Text>
            ) : (
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
            )}
        </>
    );
};
