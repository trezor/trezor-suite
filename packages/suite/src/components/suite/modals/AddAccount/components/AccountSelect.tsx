import React from 'react';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';
import { P, Button, variables, colors } from '@trezor/components';
import { Network, ExternalNetwork, Account } from '@wallet-types';
import { NETWORKS } from '@wallet-config';
import l10nMessages from '../messages';

interface Props {
    selectedNetwork?: Network | ExternalNetwork;
    enabledNetworks: string[];
    accounts: Account[];
    onEnableAccount: (account: Account) => void;
    onEnableNetwork: (symbol: string) => void;
}

const StyledButton = styled(Button)`
    margin: 4px 0px;
`;

const StyledP = styled(P)`
    margin: 20px 0;
`;

const AccountNameWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

const AccountName = styled.div`
    font-size: ${variables.FONT_SIZE.BIG};
    color: ${colors.TEXT_PRIMARY};
`;

const AccountDescription = styled.div`
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const EnableNetwork = (props: {
    selectedNetwork: Network;
    onEnableNetwork: Props['onEnableNetwork'];
}) => (
    <>
        <StyledP>
            <FormattedMessage
                {...l10nMessages.TR_ENABLE_NETWORK}
                values={{ networkName: props.selectedNetwork.name }}
            />
        </StyledP>
        <StyledButton fullWidth onClick={() => props.onEnableNetwork(props.selectedNetwork.symbol)}>
            <FormattedMessage
                {...l10nMessages.TR_ENABLE_NETWORK_BUTTON}
                values={{ networkName: props.selectedNetwork.name }}
            />
        </StyledButton>
    </>
);

const AccountButton = (props: {
    network: Network;
    accounts: Account[];
    onEnableAccount: Props['onEnableAccount'];
}) => {
    if (props.accounts.length === 0) return null;
    const account = props.accounts[props.accounts.length - 1];
    let enabled = true;
    let description = account.path;
    if (props.accounts.length > 1) {
        // prev account is empty, do not add another
        enabled = false;
        description = 'Previous account is empty';
    }
    if (account.index >= 10) {
        enabled = false;
        description = 'Account index is greater than 10';
    }
    const prefix = props.network.accountType ? `${props.network.accountType} ` : '';
    const label = `${prefix}Account #${account.index + 1}`;
    return (
        <StyledButton
            icon="PLUS"
            fullWidth
            align="left"
            variant="white"
            isDisabled={!enabled}
            onClick={() => props.onEnableAccount(account)}
        >
            <AccountNameWrapper>
                <AccountName>{label}</AccountName>
                <AccountDescription>{description}</AccountDescription>
            </AccountNameWrapper>
        </StyledButton>
    );
};

const AccountSelect = ({
    selectedNetwork,
    enabledNetworks,
    accounts,
    onEnableAccount,
    onEnableNetwork,
}: Props) => {
    if (!selectedNetwork || selectedNetwork.networkType === 'external') return null;
    const { symbol } = selectedNetwork;
    if (!enabledNetworks.includes(selectedNetwork.symbol)) {
        return (
            <EnableNetwork selectedNetwork={selectedNetwork} onEnableNetwork={onEnableNetwork} />
        );
    }

    const accountTypes = NETWORKS.filter(n => n.symbol === symbol);
    const availableAccounts = accounts.filter(a => a.symbol === symbol && a.empty);
    return (
        <>
            {accountTypes.map(t => {
                const emptyAccounts = availableAccounts.filter(
                    a => a.accountType === (t.accountType || 'normal'),
                );
                return (
                    <AccountButton
                        key={t.name}
                        network={t}
                        accounts={emptyAccounts}
                        onEnableAccount={onEnableAccount}
                    />
                );
            })}
        </>
    );
};

export default AccountSelect;
