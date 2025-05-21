import { Context } from '@suite-common/message-system';
import {
    isSupportedEthStakingNetworkSymbol,
    isSupportedSolStakingNetworkSymbol,
} from '@suite-common/wallet-utils';
import { Column } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';

import { AccountImported } from './AccountImported';
import { AccountOutOfSync } from './AccountOutOfSync';
import { AuthConfirmFailed } from './AuthConfirmFailed';
import { BackendDisconnected } from './BackendDisconnected';
import { ContextMessage } from './ContextMessage';
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

    return (
        <Column gap={spacings.sm}>
            {account?.accountType === 'coinjoin' && <ContextMessage context={Context.coinjoin} />}
            {account?.symbol &&
                isSupportedEthStakingNetworkSymbol(account.symbol) &&
                route?.name === 'wallet-staking' && <ContextMessage context={Context.ethStaking} />}
            {account?.symbol &&
                isSupportedSolStakingNetworkSymbol(account.symbol) &&
                route?.name === 'wallet-staking' && <ContextMessage context={Context.solStaking} />}
            <AuthConfirmFailed />
            <BackendDisconnected />
            <DeviceUnavailable />
            <TorDisconnected />
            <ReserveBanner account={account} />
            <AccountImported account={account} />
            <AccountOutOfSync account={account} />
            <EvmExplanationBanner account={account} />
            <TaprootBanner account={account} />
            {account?.networkType === 'stellar' && <StellarLimitedHistoryBanner />}
            {account?.symbol && <StakingBanner account={account} />}
        </Column>
    );
};
