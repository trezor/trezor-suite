import styled from 'styled-components';

import { Account } from 'src/types/wallet';

import AuthConfirmFailed from '../../AccountMode/AuthConfirmFailed';
import BackendDisconnected from '../../AccountMode/BackendDisconnected';
import DeviceUnavailable from '../../AccountMode/DeviceUnavailable';
import { XRPReserve } from '../../AccountAnnouncement/XRPReserve';
import { AccountImported } from '../../AccountAnnouncement/AccountImported';
import { AccountOutOfSync } from '../../AccountAnnouncement/AccountOutOfSync';
import { TorDisconnected } from '../../AccountAnnouncement/TorDisconnected';
import { CoinjoinContextMessage } from '../../AccountAnnouncement/CoinjoinContextMessage';

const BannersWrapper = styled.div`
    display: flex;
    flex-direction: column;

    > div:last-child {
        margin-bottom: 24px;
    }
`;

type AccountBannersProps = {
    account?: Account;
};

export const AccountBanners = ({ account }: AccountBannersProps) => (
    <BannersWrapper>
        <CoinjoinContextMessage account={account} />
        <AuthConfirmFailed />
        <BackendDisconnected />
        <DeviceUnavailable />
        <TorDisconnected />
        <XRPReserve account={account} />
        <AccountImported account={account} />
        <AccountOutOfSync account={account} />
    </BannersWrapper>
);
