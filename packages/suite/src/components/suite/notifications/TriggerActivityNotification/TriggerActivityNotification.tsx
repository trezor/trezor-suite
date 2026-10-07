import { useState } from 'react';

import { useDevice } from '@suite/device';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { type TrezorDevice } from '@suite-common/suite-types';
import { AUTH_DEVICE, notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectAccounts, selectTransactions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getAccountTransactions } from '@suite-common/wallet-utils';
import { Checkbox, Column, Select } from '@trezor/components';
import { DEVICE } from '@trezor/connect';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

const MOCK_TX = {
    amount: '0.05',
    descriptor: 'debug-descriptor',
    symbol: 'btc' as NetworkSymbol,
    txid: 'debug-txid',
};

const LONG_TITLE_MOCK_TOKEN = {
    contract: '0x0000000000000000000000000000000000000000',
    name: 'Trust Wallet Token',
    symbol: 'TWT',
};

const LONG_TITLE_MOCK_TX = {
    formattedAmount: '0 TWT',
    descriptor: 'Trezor Safe 5 Passphrase wallet #1 Optimism #2',
    symbol: 'op' as NetworkSymbol,
    txid: 'debug-txid-long-title',
    token: LONG_TITLE_MOCK_TOKEN,
};

const LONG_TITLE_PREFERRED_NETWORKS: NetworkSymbol[] = ['op', 'eth', 'base', 'arb'];

type DebugTransactionFields = {
    formattedAmount: string;
    descriptor: string;
    symbol: NetworkSymbol;
    txid: string;
};

type GetDebugTransactionFieldsParams = {
    account?: Account;
    txid?: string;
    fallback: DebugTransactionFields;
    formattedAmount?: string;
};

const getDebugTransactionFields = ({
    account,
    txid,
    fallback,
    formattedAmount,
}: GetDebugTransactionFieldsParams): DebugTransactionFields => {
    if (!account) {
        return fallback;
    }

    return {
        formattedAmount: formattedAmount ?? fallback.formattedAmount,
        descriptor: account.descriptor,
        symbol: account.symbol,
        txid: txid ?? fallback.txid,
    };
};

type GetLongTitleDebugAccountParams = {
    accounts: Account[];
    selectedDeviceState?: Account['deviceState'];
};

const getLongTitleDebugAccount = ({
    accounts,
    selectedDeviceState,
}: GetLongTitleDebugAccountParams): Account | undefined => {
    const otherWalletAccounts = accounts.filter(
        account => account.deviceState !== selectedDeviceState,
    );
    const candidateAccounts = otherWalletAccounts.length > 0 ? otherWalletAccounts : accounts;

    for (const networkSymbol of LONG_TITLE_PREFERRED_NETWORKS) {
        const match = candidateAccounts.find(account => account.symbol === networkSymbol);

        if (match) {
            return match;
        }
    }

    return candidateAccounts[0];
};

const getDebugToken = (account?: Account) => {
    const accountToken = account?.tokens?.find(token => token.contract && token.symbol);

    if (!accountToken) {
        return LONG_TITLE_MOCK_TOKEN;
    }

    return {
        contract: accountToken.contract,
        name: accountToken.name,
        symbol: accountToken.symbol,
    };
};

type DebugNotificationAction =
    | ReturnType<typeof notificationsActions.addToast>
    | ReturnType<typeof notificationsActions.addEvent>;

type PresetContext = {
    device?: TrezorDevice;
    seen: boolean;
    account?: Account;
    txid?: string;
};

type Preset = {
    value: string;
    label: string;
    build: (ctx: PresetContext) => DebugNotificationAction | undefined;
};

const PRESETS: Preset[] = [
    {
        value: 'device-connect',
        label: 'Activity: Device connected',
        build: ({ device, seen }) =>
            device
                ? notificationsActions.addEvent({ type: DEVICE.CONNECT, device, seen })
                : undefined,
    },
    {
        value: 'device-connect-unacquired',
        label: 'Activity: Device connected (unacquired)',
        build: ({ device, seen }) =>
            device
                ? notificationsActions.addEvent({ type: DEVICE.CONNECT_UNACQUIRED, device, seen })
                : undefined,
    },
    {
        value: 'auth-device',
        label: 'Activity: Device authorized',
        build: ({ seen }) => notificationsActions.addEvent({ type: AUTH_DEVICE, seen }),
    },
    {
        value: 'settings-applied',
        label: 'System: Settings applied',
        build: ({ seen }) => notificationsActions.addToast({ type: 'settings-applied', seen }),
    },
    {
        value: 'pin-changed',
        label: 'System: PIN changed',
        build: ({ seen }) => notificationsActions.addToast({ type: 'pin-changed', seen }),
    },
    {
        value: 'device-wiped',
        label: 'System: Device wiped',
        build: ({ seen }) => notificationsActions.addToast({ type: 'device-wiped', seen }),
    },
    {
        value: 'backup-success',
        label: 'System: Backup success',
        build: ({ seen }) => notificationsActions.addToast({ type: 'backup-success', seen }),
    },
    {
        value: 'backup-failed',
        label: 'System: Backup failed',
        build: ({ seen }) => notificationsActions.addToast({ type: 'backup-failed', seen }),
    },
    {
        value: 'clear-storage',
        label: 'System: Storage cleared',
        build: ({ seen }) => notificationsActions.addToast({ type: 'clear-storage', seen }),
    },
    {
        value: 'error',
        label: 'Error: Generic error',
        build: ({ seen }) =>
            notificationsActions.addToast({ type: 'error', error: 'Debug error message', seen }),
    },
    {
        value: 'discovery-error',
        label: 'Error: Discovery error',
        build: ({ seen }) =>
            notificationsActions.addToast({
                type: 'discovery-error',
                error: 'Debug discovery error',
                seen,
            }),
    },
    {
        value: 'sign-tx-error',
        label: 'Error: Sign transaction error',
        build: ({ seen }) =>
            notificationsActions.addToast({
                type: 'sign-tx-error',
                error: 'Debug sign transaction error',
                seen,
            }),
    },
    {
        value: 'tx-received',
        label: 'Transaction: Received',
        build: ({ device, seen, account, txid }) =>
            notificationsActions.addEvent({
                type: 'tx-received',
                device,
                seen,
                ...getDebugTransactionFields({ account, txid, fallback: MOCK_TX }),
            }),
    },
    {
        value: 'tx-confirmed',
        label: 'Transaction: Confirmed',
        build: ({ device, seen, account, txid }) =>
            notificationsActions.addEvent({
                type: 'tx-confirmed',
                device,
                seen,
                ...getDebugTransactionFields({ account, txid, fallback: MOCK_TX }),
            }),
    },
    {
        value: 'tx-confirmed-long-title',
        label: 'Transaction: Confirmed (long title)',
        build: ({ device, seen, account, txid }) =>
            notificationsActions.addEvent({
                type: 'tx-confirmed',
                device,
                seen,
                token: getDebugToken(account),
                ...getDebugTransactionFields({
                    account,
                    txid,
                    fallback: LONG_TITLE_MOCK_TX,
                    formattedAmount: LONG_TITLE_MOCK_TX.formattedAmount,
                }),
            }),
    },
    {
        value: 'tx-sent',
        label: 'Transaction: Sent',
        build: ({ device, seen, account, txid }) =>
            notificationsActions.addToast({
                type: 'tx-sent',
                device,
                seen,
                ...getDebugTransactionFields({ account, txid, fallback: MOCK_TX }),
            }),
    },
    {
        value: 'tx-staked',
        label: 'Transaction: Staked',
        build: ({ device, seen, account, txid }) =>
            notificationsActions.addToast({
                type: 'tx-staked',
                device,
                seen,
                ...getDebugTransactionFields({ account, txid, fallback: MOCK_TX }),
            }),
    },
    {
        value: 'tx-unstaked',
        label: 'Transaction: Unstaked',
        build: ({ device, seen, account, txid }) =>
            notificationsActions.addToast({
                type: 'tx-unstaked',
                device,
                seen,
                ...getDebugTransactionFields({ account, txid, fallback: MOCK_TX }),
            }),
    },
    {
        value: 'tx-claimed',
        label: 'Transaction: Claimed',
        build: ({ device, seen, account, txid }) =>
            notificationsActions.addToast({
                type: 'tx-claimed',
                device,
                seen,
                ...getDebugTransactionFields({ account, txid, fallback: MOCK_TX }),
            }),
    },
    {
        value: 'successful-claim',
        label: 'Transaction: Successful claim',
        build: ({ seen }) =>
            notificationsActions.addToast({
                type: 'successful-claim',
                symbol: MOCK_TX.symbol,
                seen,
            }),
    },
];

const options = PRESETS.map(({ value, label }) => ({ value, label }));

export const TriggerActivityNotification = () => {
    const { dispatch } = useServices(injectDispatch);
    const { device } = useDevice();
    const accounts = useSelector(selectAccounts);
    const transactions = useSelector(selectTransactions);
    const [selectedValue, setSelectedValue] = useState<string>(PRESETS[0]?.value ?? '');
    const [addAsUnseen, setAddAsUnseen] = useState(true);

    const selectedOption = options.find(o => o.value === selectedValue) ?? options[0];

    const handleAdd = () => {
        const preset = PRESETS.find(p => p.value === selectedValue);
        if (!preset) return;

        const account =
            preset.value === 'tx-confirmed-long-title'
                ? getLongTitleDebugAccount({
                      accounts,
                      selectedDeviceState: device?.state?.staticSessionId,
                  })
                : accounts[0];
        const txid = account
            ? getAccountTransactions(account.key, transactions).find(
                  transaction => transaction?.txid,
              )?.txid
            : undefined;

        const action = preset.build({ device, seen: !addAsUnseen, account, txid });
        if (action) {
            dispatch(action);
        } else {
            dispatch(
                notificationsActions.addToast({
                    type: 'error',
                    error: 'Debug: connect a device to trigger this activity type',
                }),
            );
        }
    };

    return (
        <SectionItem data-testid="@settings/debug/trigger-activity">
            <TextColumn
                title="Trigger activity notification"
                description="Add a notification/activity entry of a selected type to test the Activity page. Transaction types show up in the Notifications tab, everything else in the All activity tab."
            />
            <ActionColumn>
                <Column gap={12} alignItems="flex-end">
                    <Select
                        size="small"
                        width={260}
                        value={selectedOption}
                        options={options}
                        onChange={(option: { value: string }) => setSelectedValue(option.value)}
                        data-testid="@activity/debug/preset-select"
                    />
                    <Checkbox
                        isChecked={addAsUnseen}
                        labelAlignment="end"
                        onChange={() => setAddAsUnseen(prev => !prev)}
                        data-testid="@activity/debug/unseen-checkbox"
                    >
                        <TextColumn description="Add as unseen (new)" />
                    </Checkbox>
                    <ActionButton
                        intent="brand"
                        onClick={handleAdd}
                        data-testid="@activity/debug/add-button"
                    >
                        Add activity
                    </ActionButton>
                </Column>
            </ActionColumn>
        </SectionItem>
    );
};
