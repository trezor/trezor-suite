import styled from 'styled-components';

import { type DappCatalogEntry } from '@suite/dapp-browser';
import { Translation } from '@suite/intl';
import { type Account } from '@suite-common/wallet-types';
import { walletConnectPairThunk } from '@suite-common/walletconnect';
import {
    Button,
    Column,
    Dropdown,
    Icon,
    IconButton,
    Link,
    Text,
    Tooltip,
} from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';
import { spacings, spacingsPx } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';

const Bar = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.sm};
    padding: ${spacingsPx.sm} ${spacingsPx.md};
    border-bottom: 1px solid ${({ theme }) => theme.borderNeutral};
    flex-wrap: wrap;
`;

const Title = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
    font-weight: 600;
`;

const Spacer = styled.div`
    flex: 1;
`;

const Badge = styled.div`
    padding: ${spacingsPx.xxs} ${spacingsPx.sm};
    border: 1px solid ${({ theme }) => theme.borderNeutral};
    border-radius: 999px;
    font-size: 13px;
`;

const AccountControl = styled.div`
    display: flex;
    align-items: center;
    gap: ${spacingsPx.xxs};
`;

const shortenAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`;

const accountLabel = (account: Account) =>
    account.accountLabel || `Account #${account.index + 1} · ${shortenAddress(account.descriptor)}`;

type DappTopBarProps = {
    entry: DappCatalogEntry;
    accounts: Account[];
    selectedAddress: string | undefined;
    onSelectAccount: (address: string) => void;
    onClose: () => void;
};

export const DappTopBar = ({
    entry,
    accounts,
    selectedAddress,
    onSelectAccount,
    onClose,
}: DappTopBarProps) => {
    const dispatch = useDispatch();

    // §5: the user copies the dApp's wc: URI, then this reads the clipboard and
    // hands it to Suite's existing WalletConnect pairing flow (which validates
    // and toasts on an invalid URI).
    const handleWalletConnect = async () => {
        const uri = await desktopApi.dappBrowserReadClipboard();
        dispatch(walletConnectPairThunk({ uri }));
    };

    const accountItems = accounts.map(account => ({
        label: accountLabel(account),
        onClick: () => onSelectAccount(account.descriptor),
    }));

    return (
        <Bar>
            <IconButton
                icon="caretLeft"
                intent="neutral"
                priority="secondary"
                size="small"
                onClick={() => desktopApi.dappBrowserGoBack()}
                tooltip={{ content: <Translation id="TR_DAPP_BROWSER_BACK" /> }}
            />
            <IconButton
                icon="caretRight"
                intent="neutral"
                priority="secondary"
                size="small"
                onClick={() => desktopApi.dappBrowserGoForward()}
                tooltip={{ content: <Translation id="TR_DAPP_BROWSER_FORWARD" /> }}
            />
            <IconButton
                icon="arrowClockwise"
                intent="neutral"
                priority="secondary"
                size="small"
                onClick={() => desktopApi.dappBrowserReload()}
                tooltip={{ content: <Translation id="TR_DAPP_BROWSER_RELOAD" /> }}
            />

            <Title>
                {entry.name}
                <Tooltip
                    content={
                        <Column gap={spacings.xs} alignItems="flex-start">
                            <Text>{entry.description}</Text>
                            <Link href={entry.url} target="_blank">
                                {entry.url}
                            </Link>
                        </Column>
                    }
                >
                    <Icon name="info" size={16} intent="neutral" />
                </Tooltip>
            </Title>

            <Spacer />

            <Badge>Ethereum</Badge>

            <AccountControl>
                <Text typographyStyle="body-sm">
                    {selectedAddress ? shortenAddress(selectedAddress) : '—'}
                </Text>
                <Dropdown items={accountItems} iconName="caretDown" />
            </AccountControl>

            <Button
                intent="neutral"
                priority="secondary"
                size="small"
                onClick={handleWalletConnect}
            >
                <Translation id="TR_DAPP_BROWSER_WALLETCONNECT" />
            </Button>

            <Button intent="neutral" priority="secondary" size="small" onClick={onClose}>
                <Translation id="TR_DAPP_BROWSER_CLOSE" />
            </Button>
        </Bar>
    );
};
