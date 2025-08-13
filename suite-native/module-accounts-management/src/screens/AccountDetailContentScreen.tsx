import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { WithLabelingState, selectAccountLabel } from '@suite-common/local-first-storage';
import { Account, TokenAddress } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { EventType, analytics } from '@suite-native/analytics';
import { Screen } from '@suite-native/navigation';
import { TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { TransactionList } from '@suite-native/transactions';

import { AccountDetailScreenHeader } from '../components/AccountDetailScreenHeader';
import { TokenAccountDetailScreenHeader } from '../components/TokenAccountDetailScreenHeader';
import { TransactionListHeader } from '../components/TransactionListHeader';

type AccountDetailContentScreenProps = {
    account: Account;
    tokenContract?: TokenAddress;
};

export const AccountDetailContentScreen = ({
    account,
    tokenContract,
}: AccountDetailContentScreenProps) => {
    const { walletDescriptor } = parseDeviceStaticSessionId(account.deviceState);

    const localFirstAccountLabel = useSelector((state: WithLabelingState) =>
        selectAccountLabel({ state, walletDescriptor, accountKey: account.key }),
    );

    const token = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, account.key, tokenContract),
    );

    useEffect(() => {
        if (account) {
            analytics.report({
                type: EventType.AssetDetail,
                payload: {
                    assetSymbol: account.symbol,
                    tokenSymbol: token?.symbol,
                    tokenAddress: token?.contract,
                },
            });
        }
    }, [account, token?.symbol, token?.contract]);

    const listHeaderComponent = useMemo(
        () => <TransactionListHeader accountKey={account.key} tokenContract={tokenContract} />,
        [account.key, tokenContract],
    );

    return (
        <Screen
            header={
                tokenContract ? (
                    <TokenAccountDetailScreenHeader
                        tokenContract={tokenContract}
                        accountKey={account.key}
                    />
                ) : (
                    <AccountDetailScreenHeader
                        accountLabel={
                            localFirstAccountLabel?.label ?? account?.accountLabel ?? null
                        }
                        accountKey={account.key}
                    />
                )
            }
            noHorizontalPadding
        >
            <TransactionList
                accountKey={account.key}
                tokenContract={tokenContract}
                listHeaderComponent={listHeaderComponent}
            />
        </Screen>
    );
};
