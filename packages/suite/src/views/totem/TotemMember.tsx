import { useCallback, useEffect, useRef, useState } from 'react';

import { Translation } from '@suite/intl';
import { openDeferredModal } from '@suite/modal';
import { selectTorState } from '@suite/tor';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { blockchainActions, reconnectBlockchainThunk } from '@suite-common/wallet-core';
import { Badge, Button, Card, Column, Input, Row, Spinner, Text } from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { type TotemServiceState, desktopApi } from '@trezor/suite-desktop-api';
import { spacings } from '@trezor/theme';

import { useDispatch, useSelector } from 'src/hooks/suite';

// Map a discovered service id to the Suite backend it configures.
const SERVICE_BACKEND: Record<string, { symbol: NetworkSymbol; type: 'monero' }> = {
    xmr: { symbol: 'xmr', type: 'monero' },
};

// Accept a pasted address in any shape (scheme, port, path) and reduce it to the bare host.
const normalizeOnion = (input: string) =>
    input
        .trim()
        .toLowerCase()
        .replace(/^\w+:\/\//, '')
        .replace(/\/.*$/, '')
        .replace(/:\d+$/, '');

// A v3 onion address is exactly 56 base32 chars + ".onion". Validate before fetching so a pasted
// clearnet URL (e.g. the gist someone shared the address through) can't be probed over Tor.
const V3_ONION = /^[a-z2-7]{56}\.onion$/;

export const TotemMember = () => {
    const dispatch = useDispatch();
    const { isTorEnabled } = useSelector(selectTorState);
    // .onion is only reachable through the Electron session's Tor proxy, which exists on desktop
    // with Tor enabled. Without it the fetch would fail confusingly, so gate the whole flow.
    const canProbe = isDesktop() && isTorEnabled;

    // The configured xmr backend is persisted in redux, so derive the connected state from it — the
    // component's own state is lost when navigating away, which otherwise looks like "not connected".
    const persistedXmrHost = useSelector(state => {
        const backends = state.wallet.blockchain.xmr?.backends;
        const type = backends?.selected;
        const url = type ? backends?.urls?.[type]?.[0] : undefined;

        return url ? normalizeOnion(url) : undefined;
    });

    const [onion, setOnion] = useState(persistedXmrHost ?? '');
    const [probing, setProbing] = useState(false);
    const [services, setServices] = useState<TotemServiceState[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [connecting, setConnecting] = useState<string | null>(null);
    // A probe over Tor can take up to 20s. If the user edits the address (or re-probes) meanwhile,
    // the in-flight probe's result belongs to the OLD onion — this counter lets us drop it so a
    // stale service list can't get bound to a different address.
    const probeIdRef = useRef(0);

    const host = normalizeOnion(onion);
    const validOnion = V3_ONION.test(host);

    // A service is connected when redux already points the xmr backend at this exact onion. Derived
    // (not component state) so it survives navigation and stays consistent with the persisted banner.
    const isConnected = (service: TotemServiceState) =>
        SERVICE_BACKEND[service.id]?.symbol === 'xmr' &&
        persistedXmrHost !== undefined &&
        persistedXmrHost === host;

    // Reuse Suite's QR scanner (camera / image / paste) to fill the onion field from the keeper's QR.
    const scanQr = useCallback(async () => {
        const scanned = await dispatch(openDeferredModal({ type: 'qr-reader' }));
        if (typeof scanned === 'string') setOnion(scanned);
    }, [dispatch]);

    const probe = useCallback(async () => {
        if (!validOnion || !canProbe) return;
        const probeId = (probeIdRef.current += 1);
        setProbing(true);
        setError(null);
        setServices(null);
        // Probe from the main process (over Tor). A renderer fetch to http://<onion> is blocked by
        // the browser's CORS / mixed-content rules, so the request has to run in Electron's main.
        const result = await desktopApi.probeTotem({ onion: host });
        // A newer probe or an address edit superseded this one — its result is for a stale onion.
        if (probeId !== probeIdRef.current) return;
        if (result.success) {
            setServices(result.payload.services);
        } else {
            setError(result.error ?? 'Could not reach the totem');
        }
        setProbing(false);
    }, [host, validOnion, canProbe]);

    // Restore the discovered service list for an already-connected totem: the redux backend persists
    // but the probed list is component state. Keyed on canProbe (not mount-only) so it also fires if
    // Tor was still initialising at first render; the services===null guard keeps it to one probe.
    useEffect(() => {
        if (persistedXmrHost && canProbe && services === null && !probing) probe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canProbe, persistedXmrHost]);

    const connect = useCallback(
        async (service: TotemServiceState) => {
            const backend = SERVICE_BACKEND[service.id];
            if (!backend) return;
            setConnecting(service.id);
            const url = `http://${host}:${service.virtualPort}`;
            dispatch(
                blockchainActions.setBackend({
                    symbol: backend.symbol,
                    type: backend.type,
                    urls: [url],
                }),
            );
            await dispatch(reconnectBlockchainThunk({ symbol: backend.symbol }));
            setConnecting(null);
        },
        [dispatch, host],
    );

    return (
        <Card>
            <Column gap={spacings.md} alignItems="stretch">
                <SectionItem>
                    <TextColumn
                        title={<Translation id="TR_TOTEM_MEMBER_TITLE" />}
                        description={<Translation id="TR_TOTEM_MEMBER_DESCRIPTION" />}
                    />
                </SectionItem>

                {persistedXmrHost && (
                    <Text
                        typographyStyle="body-sm"
                        intent="info"
                        data-testid="@totem/member/connected-banner"
                    >
                        <Translation
                            id="TR_TOTEM_MEMBER_CONNECTED"
                            values={{ address: persistedXmrHost }}
                        />
                    </Text>
                )}

                <Row gap={spacings.sm} alignItems="flex-end">
                    <Input
                        label={<Translation id="TR_TOTEM_ONION_LABEL" />}
                        value={onion}
                        onChange={e => {
                            // Editing the address invalidates the previous probe result and any
                            // in-flight probe (bumping the id so its late result is dropped, and
                            // clearing `probing` so the field/button don't stay locked behind it).
                            probeIdRef.current += 1;
                            setProbing(false);
                            setOnion(e.target.value);
                            setServices(null);
                            setError(null);
                        }}
                        placeholder="xxxxxxxx.onion"
                        data-testid="@totem/member/onion"
                    />
                    <Button priority="secondary" onClick={scanQr}>
                        <Translation id="TR_TOTEM_SCAN_QR" />
                    </Button>
                    <Button
                        onClick={probe}
                        isDisabled={probing || !validOnion || !canProbe}
                        isLoading={probing}
                    >
                        <Translation id="TR_TOTEM_PROBE" />
                    </Button>
                </Row>

                {!canProbe ? (
                    <Text typographyStyle="body-sm" intent="warning">
                        <Translation id="TR_TOTEM_REQUIRES_TOR" />
                    </Text>
                ) : (
                    onion.trim() !== '' &&
                    !validOnion && (
                        <Text typographyStyle="body-sm" intent="warning">
                            <Translation id="TR_TOTEM_INVALID_ONION" />
                        </Text>
                    )
                )}

                {probing && (
                    <Row gap={spacings.sm} alignItems="center">
                        <Spinner size={20} />
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_TOTEM_PROBING" />
                        </Text>
                    </Row>
                )}

                {error && (
                    <Column gap={spacings.xxs} alignItems="flex-start">
                        <Text intent="critical" typographyStyle="body-sm">
                            <Translation id="TR_TOTEM_PROBE_ERROR" values={{ error }} />
                        </Text>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <Translation id="TR_TOTEM_PROBE_HINT" />
                        </Text>
                    </Column>
                )}

                {services?.length === 0 && (
                    <Text typographyStyle="body-sm">
                        <Translation id="TR_TOTEM_NO_SERVICES" />
                    </Text>
                )}

                {services?.map(service => (
                    <SectionItem key={service.id}>
                        <TextColumn
                            title={service.id.toUpperCase()}
                            description={
                                <Badge intent={service.status === 'active' ? 'info' : 'warning'}>
                                    {service.status}
                                </Badge>
                            }
                        />
                        <ActionColumn>
                            <Button
                                onClick={() => connect(service)}
                                isLoading={connecting === service.id}
                                isDisabled={
                                    service.status !== 'active' ||
                                    isConnected(service) ||
                                    connecting === service.id
                                }
                            >
                                <Translation
                                    id={
                                        isConnected(service)
                                            ? 'TR_TOTEM_CONNECTED'
                                            : 'TR_TOTEM_CONNECT'
                                    }
                                />
                            </Button>
                        </ActionColumn>
                    </SectionItem>
                ))}

                {services?.some(service => service.status !== 'active') && (
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        <Translation id="TR_TOTEM_SERVICE_PENDING_HINT" />
                    </Text>
                )}
            </Column>
        </Card>
    );
};
