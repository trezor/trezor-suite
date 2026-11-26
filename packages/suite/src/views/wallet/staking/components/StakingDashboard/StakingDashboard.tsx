import { useRefreshStakingProductInfo } from '@suite-common/earn-staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account, type SelectedAccountLoaded } from '@suite-common/wallet-types';

import { WalletLayout } from '#src/components/wallet/WalletLayout/WalletLayout';

import { StakingFooter } from './components/StakingFooter';

type StakingDashboardProps = {
    dashboard: React.ReactElement;
} & ({ selectedAccount: SelectedAccountLoaded } | { account: Account });

export const StakingDashboard = (props: StakingDashboardProps) => {
    useRefreshStakingProductInfo();

    const account = 'account' in props ? props.account : props.selectedAccount.account;
    const content = (
        <>
            {props.dashboard}
            <StakingFooter networkType={account.networkType} />
        </>
    );

    if ('account' in props) return content;

    return (
        <WalletLayout
            title="TR_EARN_STAKE_TOKEN"
            titleValues={{ symbol: getNetworkDisplaySymbol(account.symbol) }}
            account={props.selectedAccount}
        >
            {content}
        </WalletLayout>
    );
};
