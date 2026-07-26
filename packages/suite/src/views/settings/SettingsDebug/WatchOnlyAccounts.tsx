import { type FormEvent, useState } from 'react';

import styled from 'styled-components';

import { goto } from '@suite/router';
import {
    type NetworkSymbol,
    getNetworkOptional,
    networksCollection,
} from '@suite-common/wallet-config';
import {
    fetchAndUpdateAccountThunk,
    selectAccountsByDeviceState,
    selectDeviceThunk,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isAddressBasedNetwork } from '@suite-common/wallet-utils';
import { Button, Column, Input, Row, Select, Text } from '@trezor/components';
import {
    ActionButton,
    ActionColumn,
    SectionItem,
    TextColumn,
    TokenIcon,
} from '@trezor/product-components';

import {
    WATCH_ONLY_DEVICE_STATE,
    importWatchOnlyAccountThunk,
    removeWatchOnlyAccountThunk,
    watchOnlyDevice,
} from 'src/actions/wallet/watchOnlyAccountActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

const AccountDescriptor = styled.div`
    max-width: 420px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const Form = styled.form`
    width: min(520px, 100%);
`;

const networkOptions = networksCollection
    .filter(network => !network.isHidden)
    .map(network => ({
        label: network.name,
        value: network.symbol,
    }))
    .sort((first, second) => first.label.localeCompare(second.label));

const WatchOnlyAccountItem = ({ account }: { account: Account }) => {
    const dispatch = useDispatch();
    const handleOpen = async () => {
        await dispatch(selectDeviceThunk({ device: watchOnlyDevice }));
        dispatch(
            goto({
                routeName: 'wallet-index',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );
    };
    const actions = [
        { label: 'Open account', intent: 'neutral' as const, onClick: handleOpen },
        {
            label: 'Refresh',
            intent: 'neutral' as const,
            onClick: () => dispatch(fetchAndUpdateAccountThunk({ accountKey: account.key })),
        },
        {
            label: 'Remove',
            intent: 'critical' as const,
            onClick: () => dispatch(removeWatchOnlyAccountThunk({ account })),
        },
    ];

    return (
        <SectionItem data-testid={`@settings/debug/watch-only/account/${account.key}`}>
            <TextColumn
                title={
                    <Row gap={8}>
                        <TokenIcon symbol={account.symbol} />
                        {account.watchOnlyLabel}
                    </Row>
                }
                description={
                    <Column gap={4}>
                        <AccountDescriptor>
                            <Text typographyStyle="body-sm">{account.descriptor}</Text>
                        </AccountDescriptor>
                        <Text typographyStyle="body-sm" color="contentSecondary">
                            {getNetworkOptional(account.symbol)?.name ?? account.symbol} ·
                            Watch-only
                        </Text>
                    </Column>
                }
            />
            <ActionColumn>
                {actions.map(({ label, ...actionProps }) => (
                    <ActionButton key={label} size="small" priority="secondary" {...actionProps}>
                        {label}
                    </ActionButton>
                ))}
            </ActionColumn>
        </SectionItem>
    );
};

export const WatchOnlyAccounts = () => {
    const dispatch = useDispatch();
    const watchOnlyAccounts = useSelector(state =>
        selectAccountsByDeviceState(state, WATCH_ONLY_DEVICE_STATE),
    );

    const [networkSymbol, setNetworkSymbol] = useState<NetworkSymbol>('eth');
    const [descriptor, setDescriptor] = useState('');
    const [accountLabel, setAccountLabel] = useState('');
    const [errorMessage, setErrorMessage] = useState<string>();
    const [isImporting, setIsImporting] = useState(false);

    const selectedNetworkOption = networkOptions.find(option => option.value === networkSymbol);
    const selectedNetwork = getNetworkOptional(networkSymbol);
    let identifierLabel = 'Account public key (XPUB) or descriptor';
    let identifierDescription = 'Enter an account-level public key or descriptor.';

    switch (selectedNetwork?.networkType) {
        case 'bitcoin':
            identifierLabel = 'Public address, XPUB or descriptor';
            identifierDescription =
                'Enter a single public address or an account-level public key or descriptor.';
            break;
        case 'cardano':
            identifierLabel = 'Cardano account public key';
            identifierDescription = 'Enter a 128-character hexadecimal Cardano account public key.';
            break;
        default:
            if (selectedNetwork && isAddressBasedNetwork(selectedNetwork.networkType)) {
                identifierLabel = 'Public address';
                identifierDescription = 'Enter the public address for the selected network.';
            }
    }

    const handleImport = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setErrorMessage(undefined);
        setIsImporting(true);

        const result = await dispatch(
            importWatchOnlyAccountThunk({
                descriptor,
                accountLabel: accountLabel.trim() || undefined,
                symbol: networkSymbol,
            }),
        );

        setIsImporting(false);
        if (result.meta.requestStatus === 'fulfilled') {
            setDescriptor('');
            setAccountLabel('');

            return;
        }

        setErrorMessage(result.payload ?? 'The watch-only account could not be imported.');
    };

    return (
        <>
            <SectionItem data-testid="@settings/debug/watch-only/import">
                <TextColumn
                    title="Import watch-only account"
                    description="Load an external public address or account public key through Suite's regular backend pipeline. The account remains local to this session and cannot authorize transactions."
                />
                <ActionColumn>
                    <Form onSubmit={handleImport}>
                        <Column gap={8}>
                            <Select
                                label="Network"
                                options={networkOptions}
                                value={selectedNetworkOption}
                                onChange={option => setNetworkSymbol(option.value as NetworkSymbol)}
                                isDisabled={isImporting}
                                data-testid="@settings/debug/watch-only/network"
                            />
                            <Input
                                label={identifierLabel}
                                value={descriptor}
                                onChange={event => setDescriptor(event.target.value)}
                                isDisabled={isImporting}
                                hasError={!!errorMessage}
                                data-testid="@settings/debug/watch-only/identifier"
                            />
                            <Text typographyStyle="body-sm" color="contentSecondary">
                                {identifierDescription}
                            </Text>
                            <Input
                                label="Label (optional)"
                                value={accountLabel}
                                onChange={event => setAccountLabel(event.target.value)}
                                isDisabled={isImporting}
                                data-testid="@settings/debug/watch-only/label"
                            />
                            <Button
                                type="submit"
                                isLoading={isImporting}
                                isDisabled={!descriptor.trim()}
                                data-testid="@settings/debug/watch-only/import-button"
                            >
                                Import account
                            </Button>
                            {!!errorMessage && (
                                <Text intent="critical" typographyStyle="body-sm">
                                    {errorMessage}
                                </Text>
                            )}
                        </Column>
                    </Form>
                </ActionColumn>
            </SectionItem>

            {watchOnlyAccounts.map(account => (
                <WatchOnlyAccountItem key={account.key} account={account} />
            ))}
        </>
    );
};
