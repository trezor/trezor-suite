import { ContextMessage } from '@suite/message-system';
import { selectRouteName } from '@suite/router';
import { Context } from '@suite-common/message-system';
import {
    isSupportedAdaStakingNetworkSymbol,
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
    isSupportedTronStakingNetworkSymbol,
} from '@suite-common/wallet-core';
import { Column } from '@trezor/components';

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
import { useSelector } from '../../../../hooks/suite';
import { type Account } from '../../../../types/wallet';

type AccountBannersProps = {
    account?: Account;
};

export const AccountBanners = ({ account }: AccountBannersProps) => {
    const routeName = useSelector(selectRouteName);

    return (
        <Column gap={12}>
            {account?.symbol &&
                isSupportedEthStakingNetworkSymbol(account.symbol) &&
                routeName === 'wallet-staking' && (
                    <ContextMessage context={Context.getStaking('eth')} />
                )}
            {account?.symbol &&
                isSupportedSolStakingNetworkSymbol(account.symbol) &&
                routeName === 'wallet-staking' && (
                    <ContextMessage context={Context.getStaking('sol')} />
                )}
            {account?.symbol &&
                isSupportedTronStakingNetworkSymbol(account.symbol) &&
                routeName === 'wallet-staking' && (
                    <ContextMessage context={Context.getStaking('trx')} />
                )}
            {account?.symbol &&
                isSupportedAdaStakingNetworkSymbol(account.symbol) &&
                routeName === 'wallet-staking' && (
                    <ContextMessage context={Context.getStaking('ada')} />
                )}
            <BackendDisconnected />
            <DeviceUnavailable />
            <TorDisconnected accountType={account?.accountType} />
            <ReserveBanner account={account} />
            <AccountImported account={account} />
            <AccountOutOfSync account={account} />
            <EvmExplanationBanner account={account} />
            <TaprootBanner account={account} />
            <CardanoLegacyBanner account={account} />
            {account?.networkType === 'stellar' && <StellarLimitedHistoryBanner />}
            {account?.symbol && <StakingBanner account={account} />}
            {account?.symbol && account?.accountType && (
                <ContextMessage
                    context={[
                        Context.getAccount(account.symbol),
                        Context.getAccount(account.symbol, account.accountType),
                    ]}
                />
            )}
        </Column>
    );
};
