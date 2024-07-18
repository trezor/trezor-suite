import styled from 'styled-components';

import { Account } from 'src/types/wallet';
import { AuthConfirmFailed } from './AuthConfirmFailed';
import { BackendDisconnected } from './BackendDisconnected';
import { DeviceUnavailable } from './DeviceUnavailable';
import { XRPReserve } from './XRPReserve';
import { AccountImported } from './AccountImported';
import { AccountOutOfSync } from './AccountOutOfSync';
import { TorDisconnected } from './TorDisconnected';
import { ContextMessage } from './ContextMessage';
import { StakeEthBanner } from './StakeEthBanner';
import { spacingsPx } from '@trezor/theme';
import { EvmExplanationBanner } from './EvmExplanationBanner';
import { TaprootBanner } from './TaprootBanner';
import { Context } from '@suite-common/message-system';
import { useSelector } from 'src/hooks/suite';
import { isSupportedEthStakingNetworkSymbol } from '@suite-common/wallet-core';

const BannersWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${spacingsPx.xl};
    margin-bottom: ${spacingsPx.xl};
`;

type AccountBannersProps = {
    account?: Account;
};

export const AccountBanners = ({ account }: AccountBannersProps) => {
    const { route } = useSelector(state => state.router);

    return (
        <BannersWrapper>
            {account?.accountType === 'coinjoin' && <ContextMessage context={Context.coinjoin} />}
            {account?.symbol &&
                isSupportedEthStakingNetworkSymbol(account.symbol) &&
                route?.name === 'wallet-staking' && <ContextMessage context={Context.ethStaking} />}
            <AuthConfirmFailed />
            <BackendDisconnected />
            <DeviceUnavailable />
            <TorDisconnected />
            <XRPReserve account={account} />
            <AccountImported account={account} />
            <AccountOutOfSync account={account} />
            <EvmExplanationBanner account={account} />
            <TaprootBanner account={account} />
            {account?.symbol && <StakeEthBanner account={account} />}
        </BannersWrapper>
    );
};
