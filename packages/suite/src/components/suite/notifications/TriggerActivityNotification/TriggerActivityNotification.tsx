import { useState } from 'react';

import { useDevice } from '@suite/device';
import { type TrezorDevice } from '@suite-common/suite-types';
import { AUTH_DEVICE, notificationsActions } from '@suite-common/toast-notifications';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Checkbox, Column, Select } from '@trezor/components';
import { DEVICE } from '@trezor/connect';
import { useServices } from '@trezor/dependency-injection';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

const MOCK_TX = {
    amount: '0.05',
    descriptor: 'debug-descriptor',
    symbol: 'btc' as NetworkSymbol,
    txid: 'debug-txid',
};

type DebugNotificationAction =
    | ReturnType<typeof notificationsActions.addToast>
    | ReturnType<typeof notificationsActions.addEvent>;

type PresetContext = { device?: TrezorDevice; seen: boolean };

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
        build: ({ device, seen }) =>
            notificationsActions.addEvent({ type: 'tx-received', device, ...MOCK_TX, seen }),
    },
    {
        value: 'tx-confirmed',
        label: 'Transaction: Confirmed',
        build: ({ device, seen }) =>
            notificationsActions.addEvent({ type: 'tx-confirmed', device, ...MOCK_TX, seen }),
    },
    {
        value: 'tx-sent',
        label: 'Transaction: Sent',
        build: ({ device, seen }) =>
            notificationsActions.addToast({ type: 'tx-sent', device, ...MOCK_TX, seen }),
    },
    {
        value: 'tx-staked-pending',
        label: 'Transaction: Stake pending',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-staked',
                stage: 'pending',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-staked-sped-up',
        label: 'Transaction: Stake sped-up',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-staked',
                stage: 'sped-up',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-staked-confirmed',
        label: 'Transaction: Stake confirmed',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-staked',
                stage: 'confirmed',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-unstaked-pending',
        label: 'Transaction: Unstake pending',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-unstaked',
                stage: 'pending',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-unstaked-sped-up',
        label: 'Transaction: Unstake sped-up',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-unstaked',
                stage: 'sped-up',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-unstaked-confirmed',
        label: 'Transaction: Unstake confirmed',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-unstaked',
                stage: 'confirmed',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-claimed-pending',
        label: 'Transaction: Claim pending',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-claimed',
                stage: 'pending',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-claimed-sped-up',
        label: 'Transaction: Claim sped-up',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-claimed',
                stage: 'sped-up',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-claimed-confirmed',
        label: 'Transaction: Claim confirmed',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-claimed',
                stage: 'confirmed',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-withdrawn-pending',
        label: 'Transaction: Withdraw pending',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-withdrawn',
                stage: 'pending',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-withdrawn-confirmed',
        label: 'Transaction: Withdraw confirmed',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-withdrawn',
                stage: 'confirmed',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-voted-pending',
        label: 'Transaction: Vote pending',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-voted',
                stage: 'pending',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-voted-confirmed',
        label: 'Transaction: Vote confirmed',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-voted',
                stage: 'confirmed',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-yield-deposit-pending',
        label: 'Transaction: Yield deposit pending',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-yield-deposit',
                stage: 'pending',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-yield-deposit-confirmed',
        label: 'Transaction: Yield deposit confirmed',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-yield-deposit',
                stage: 'confirmed',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-yield-withdraw-pending',
        label: 'Transaction: Yield withdraw pending',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-yield-withdraw',
                stage: 'pending',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-yield-withdraw-confirmed',
        label: 'Transaction: Yield withdraw confirmed',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-yield-withdraw',
                stage: 'confirmed',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-yield-claim-pending',
        label: 'Transaction: Yield claim pending',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-yield-claim',
                stage: 'pending',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
    {
        value: 'tx-yield-claim-confirmed',
        label: 'Transaction: Yield claim confirmed',
        build: ({ device, seen }) =>
            notificationsActions.addToast({
                type: 'tx-yield-claim',
                stage: 'confirmed',
                device,
                ...MOCK_TX,
                seen,
            }),
    },
];

const options = PRESETS.map(({ value, label }) => ({ value, label }));

export const TriggerActivityNotification = () => {
    const { dispatch } = useServices(injectDispatch);
    const { device } = useDevice();
    const [selectedValue, setSelectedValue] = useState<string>(PRESETS[0]?.value ?? '');
    const [addAsUnseen, setAddAsUnseen] = useState(true);

    const selectedOption = options.find(o => o.value === selectedValue) ?? options[0];

    const handleAdd = () => {
        const preset = PRESETS.find(p => p.value === selectedValue);
        if (!preset) return;

        const action = preset.build({ device, seen: !addAsUnseen });
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
