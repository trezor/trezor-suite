import { ContextMessage } from '@suite/message-system';
import { Context } from '@suite-common/message-system';
import {
    isSupportedAdaStakingNetworkSymbol,
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
    isSupportedTronStakingNetworkSymbol,
    toStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';

import { AccountImported } from './AccountImported';
import { AccountOutOfSync } from './AccountOutOfSync';
import { BackendDisconnected } from './BackendDisconnected';
import { CardanoLegacyBanner } from './CardanoLegacyBanner';
import { DeviceUnavailable } from './DeviceUnavailable';
import { EvmExplanationBanner } from './EvmExplanationBanner';
import { ReserveBanner } from './ReserveBanner';
import { StakingBanner } from './StakingBanner';
import { StellarLimitedHistoryBanner } from './StellarLimitedHistoryBanner';
import { TaprootBanner } from './TaprootBanner';
import { TorDisconnected } from './TorDisconnected';

type AccountBannersProps = {
    account?: Account;
};

export const AccountBanners = ({ account }: AccountBannersProps) => {
    const { route } = useSelector(state => state.router);
    const stakingSymbol = account?.symbol ? toStakingNetworkSymbol(account.symbol) : null;

    return (
        <Column gap={12}>
            {account?.symbol &&
                stakingSymbol !== null &&
                isSupportedEthStakingNetworkSymbol(account.symbol) &&
                route?.name === 'wallet-staking' && (
                    <ContextMessage context={Context.getStaking(stakingSymbol)} />
                )}
            {account?.symbol &&
                stakingSymbol !== null &&
                isSupportedSolStakingNetworkSymbol(account.symbol) &&
                route?.name === 'wallet-staking' && (
                    <ContextMessage context={Context.getStaking(stakingSymbol)} />
                )}
            {account?.symbol &&
                stakingSymbol !== null &&
                isSupportedTronStakingNetworkSymbol(account.symbol) &&
                route?.name === 'wallet-staking' && (
                    <ContextMessage context={Context.getStaking(stakingSymbol)} />
                )}
            {account?.symbol &&
                stakingSymbol !== null &&
                isSupportedAdaStakingNetworkSymbol(account.symbol) &&
                route?.name === 'wallet-staking' && (
                    <ContextMessage context={Context.getStaking(stakingSymbol)} />
                )}
            <BackendDisconnected />
            <DeviceUnavailable />
            <TorDisconnected />
            <ReserveBanner account={account} />
            <AccountImported account={account} />
            <AccountOutOfSync account={account} />
            <EvmExplanationBanner account={account} />
            <TaprootBanner account={account} />
            <CardanoLegacyBanner account={account} />
            {account?.networkType === 'stellar' && <StellarLimitedHistoryBanner />}
            {account?.symbol && <StakingBanner account={account} />}
            {account?.symbol && account?.accountType && (
                <ContextMessage context={Context.getAccount(account.symbol, account.accountType)} />
            )}
        </Column>
    );
};
