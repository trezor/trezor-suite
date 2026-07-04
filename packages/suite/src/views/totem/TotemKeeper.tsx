import { useCallback, useEffect, useState } from 'react';

import crypto from 'crypto';

import { useDevice } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import { notificationsActions } from '@suite-common/toast-notifications';
import {
    Badge,
    Box,
    Button,
    Card,
    Column,
    IconButton,
    Input,
    Row,
    Spinner,
    Switch,
    Text,
} from '@trezor/components';
import TrezorConnect from '@trezor/connect';
import { copyToClipboard } from '@trezor/dom-utils';
import { CopyIcon } from '@trezor/icons';
import { ActionColumn, QrCode, SectionItem, TextColumn } from '@trezor/product-components';
import {
    type TotemServiceState,
    type TotemServiceStatus,
    type TotemStatusEvent,
    desktopApi,
} from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';

// Dedicated cipherKeyValue derivation for the onion identity (SLIP-0011). The user secret feeds
// the value, so a different secret yields a different — but still reproducible — .onion address.
const TOTEM_ONION_PATH = "m/10077'/0'";
const TOTEM_ONION_KEY = 'Totem onion identity';

const STATUS_INTENT: Record<TotemServiceStatus, 'info' | 'warning' | 'neutral'> = {
    active: 'info',
    pending: 'warning',
    'non-active': 'neutral',
};
const STATUS_LABEL: Record<TotemServiceStatus, TranslationKey> = {
    active: 'TR_TOTEM_SERVICE_ACTIVE',
    pending: 'TR_TOTEM_SERVICE_PENDING',
    'non-active': 'TR_TOTEM_SERVICE_INACTIVE',
};
const SERVICE_LABEL: Record<string, TranslationKey> = {
    xmr: 'TR_TOTEM_SERVICE_XMR',
};

export const TotemKeeper = () => {
    const { device } = useDevice();
    const dispatch = useDispatch();
    const [provisioned, setProvisioned] = useState(false);
    const [running, setRunning] = useState(false);
    const [address, setAddress] = useState<string | undefined>();
    const [services, setServices] = useState<TotemServiceState[]>([]);
    const [secret, setSecret] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshSettings = useCallback(async () => {
        const res = await desktopApi.getTotemSettings();
        if (res.success) {
            setProvisioned(res.payload.provisioned);
            setRunning(res.payload.running);
            setAddress(res.payload.address);
            setServices(res.payload.services);
        }
    }, []);

    useEffect(() => {
        desktopApi.on('totem/status', (event: TotemStatusEvent) => {
            if (event.address !== undefined) setAddress(event.address);
            // Only override the registry when the event actually carries services (main omits them
            // for non-Enabled statuses); otherwise rely on refreshSettings()/get-settings.
            if (event.services?.length) setServices(event.services);
            setRunning(event.type === 'Enabled' || event.type === 'Provisioning');
            // Clear a stale error once a later status arrives — the main process auto-republishes
            // when Tor recovers, so an 'Enabled' event must not leave the old red banner up.
            if (event.type === 'Error') setError(event.message ?? 'Totem error');
            else setError(null);
        });
        refreshSettings();
        desktopApi.getTotemStatus();

        return () => desktopApi.removeAllListeners('totem/status');
    }, [refreshSettings]);

    const raiseTotem = useCallback(async () => {
        if (!device || !device.connected || !secret) return;
        setBusy(true);
        setError(null);
        try {
            // sha256(secret) -> 32-byte hex, a valid cipherKeyValue payload; the device deterministically
            // ciphers it into the onion seed which never leaves this machine after derivation.
            const value = crypto.createHash('sha256').update(secret, 'utf8').digest('hex');
            const result = await TrezorConnect.cipherKeyValue({
                device: {
                    path: device.path,
                    state: device.state,
                    instance: device.instance,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                },
                path: TOTEM_ONION_PATH,
                key: TOTEM_ONION_KEY,
                value,
                encrypt: true,
                askOnEncrypt: true,
                askOnDecrypt: false,
            });
            if (!result.success) {
                setError(result.error.message);

                return;
            }
            const res = await desktopApi.provisionTotem({ seedHex: result.payload.value });
            if (!res.success) {
                // Keep the secret on failure so the user can retry without retyping it.
                setError(res.error ?? 'Provisioning failed');

                return;
            }
            setSecret('');
            await refreshSettings();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    }, [device, secret, refreshSettings]);

    const toggleTotem = useCallback(async () => {
        setBusy(true);
        setError(null);
        const res = await desktopApi.toggleTotem(!running);
        if (!res.success) setError(res.error ?? 'Failed to toggle totem');
        await refreshSettings();
        setBusy(false);
    }, [running, refreshSettings]);

    const toggleService = useCallback(
        async (service: TotemServiceState) => {
            setBusy(true);
            setError(null);
            const res = await desktopApi.setTotemService({
                id: service.id,
                enabled: !service.enabled,
            });
            if (!res.success) setError(res.error ?? 'Failed to update service');
            await refreshSettings();
            setBusy(false);
        },
        [refreshSettings],
    );

    const copyAddress = useCallback(() => {
        if (!address) return;
        const result = copyToClipboard(address);
        if (typeof result !== 'string') {
            dispatch(notificationsActions.addToast({ type: 'copy-to-clipboard' }));
        }
    }, [address, dispatch]);

    return (
        <Card>
            <Column gap={spacings.md} alignItems="stretch">
                <SectionItem>
                    <TextColumn
                        title={<Translation id="TR_TOTEM_KEEPER_TITLE" />}
                        description={<Translation id="TR_TOTEM_KEEPER_DESCRIPTION" />}
                    />
                    <ActionColumn>
                        {provisioned && (
                            <Row gap={spacings.sm} alignItems="center">
                                {busy && <Spinner size={16} />}
                                <Switch
                                    isChecked={running}
                                    isDisabled={busy}
                                    onChange={toggleTotem}
                                    data-testid="@totem/keeper/toggle"
                                />
                            </Row>
                        )}
                    </ActionColumn>
                </SectionItem>

                {!provisioned && (
                    <Column gap={spacings.sm} alignItems="stretch">
                        <Row gap={spacings.sm} alignItems="flex-end">
                            <Input
                                label={<Translation id="TR_TOTEM_SECRET_LABEL" />}
                                type="password"
                                value={secret}
                                onChange={e => setSecret(e.target.value)}
                                data-testid="@totem/keeper/secret"
                            />
                            <Button
                                onClick={raiseTotem}
                                isDisabled={busy || !secret || !device?.connected}
                                isLoading={busy}
                            >
                                <Translation id="TR_TOTEM_RAISE" />
                            </Button>
                        </Row>
                        {!device?.connected && (
                            <Text typographyStyle="body-sm" intent="warning">
                                <Translation id="TR_TOTEM_RAISE_NEEDS_DEVICE" />
                            </Text>
                        )}
                    </Column>
                )}

                {address && running && (
                    <Column gap={spacings.sm} alignItems="flex-start">
                        <Row gap={spacings.sm} alignItems="center">
                            <Text typographyStyle="body-sm" data-testid="@totem/keeper/address">
                                <Translation id="TR_TOTEM_ADDRESS" values={{ address }} />
                            </Text>
                            <IconButton
                                intent="neutral"
                                priority="secondary"
                                icon={CopyIcon}
                                onClick={copyAddress}
                                tooltip={{ content: <Translation id="TR_COPY_TO_CLIPBOARD" /> }}
                                data-testid="@totem/keeper/copy-address"
                            />
                        </Row>
                        {/* Members scan this to fill their onion field — no copy/paste across machines. */}
                        <Box width={160} height={160}>
                            <QrCode value={address} />
                        </Box>
                        {/* v3 onion descriptors take ~30-60s to publish to Tor before members can reach them. */}
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_TOTEM_PROPAGATION_HINT" />
                        </Text>
                    </Column>
                )}

                {provisioned &&
                    services.map(service => (
                        <SectionItem key={service.id}>
                            <TextColumn
                                title={
                                    <Translation
                                        id={SERVICE_LABEL[service.id] ?? 'TR_TOTEM_SERVICE_XMR'}
                                    />
                                }
                                description={
                                    <Badge intent={STATUS_INTENT[service.status]}>
                                        <Translation id={STATUS_LABEL[service.status]} />
                                    </Badge>
                                }
                            />
                            <ActionColumn>
                                <Switch
                                    isChecked={service.enabled}
                                    isDisabled={busy}
                                    onChange={() => toggleService(service)}
                                />
                            </ActionColumn>
                        </SectionItem>
                    ))}

                {running && (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_TOTEM_KEEPER_GUIDANCE" />
                    </Text>
                )}

                {error && (
                    <Text intent="critical" typographyStyle="body-sm">
                        {error}
                    </Text>
                )}
            </Column>
        </Card>
    );
};
