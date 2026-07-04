/**
 * Totem — publish local services (starting with monerod) as a Tor v3 onion service so a
 * "tribe" can use this desktop as a self-hosted backend.
 *
 * The onion identity is derived from the Trezor (see the totem plan): the renderer runs
 * cipherKeyValue over a user secret and hands the resulting 32-byte seed to `totem/provision`,
 * which expands it into an ED25519-V3 key and publishes the onion. Losing the desktop but
 * keeping the Trezor + secret reproduces the same .onion address.
 *
 * This module owns the onion lifecycle and a small manifest endpoint members probe to discover
 * available services and their state. It never touches wallet keys or seed.
 */
import { captureException } from '@sentry/electron/main';
import { createHash } from 'crypto';
import http from 'http';

import { TorStatus } from '@suite/tor';
import { validateIpcMessage } from '@trezor/ipc-proxy';
import { getFreePort } from '@trezor/node-utils';
import type { OnionPortMapping } from '@trezor/request-manager';
import type { TotemServiceState, TotemServiceStatus, TotemStatus } from '@trezor/suite-desktop-api';

import { ipcMain } from '../typed-electron';
import { type Dependencies } from './module';
import { getTorController } from './tor';

export const SERVICE_NAME = 'totem';

// Well-known onion virtual port members probe to discover a totem's services.
const MANIFEST_VIRTUAL_PORT = 21341;

const MONEROD_STATUS_TIMEOUT = 2_000;

// Default service registry. Members reach monerod on the conventional 18081 (virtualPort), which
// the onion forwards to monerod's RESTRICTED RPC (targetPort 18089, see monerod.ts) — never the
// unrestricted loopback port the local wallet uses.
const DEFAULT_SERVICES: TotemService[] = [
    { id: 'xmr', virtualPort: 18081, targetPort: 18089, enabled: false },
];

const load = ({ mainWindowProxy, store, mainThreadEmitter }: Dependencies) => {
    const { logger } = global;
    const win = () => mainWindowProxy.getInstance();

    // Ensure the persisted registry contains the known services, preserving enabled flags.
    const initServices = () => {
        const persisted = store.getTotemSettings().services ?? [];
        const services = DEFAULT_SERVICES.map(def => {
            const existing = persisted.find(s => s.id === def.id);

            return existing ? { ...def, enabled: existing.enabled } : def;
        });
        store.setTotemSettings({ services });
    };
    initServices();

    // A persisted serviceId/address is stale on launch: ephemeral ADD_ONION services die with the
    // Tor process that created them. Forget it so the tor-status handler republishes (restoring the
    // same deterministic .onion) once Tor is ready — otherwise the stale id suppresses the rebuild
    // via the `!serviceId` guard and the manifest server never starts this session.
    if (store.getTotemSettings().serviceId) {
        store.setTotemSettings({ serviceId: undefined, address: undefined });
    }

    const getServices = () => store.getTotemSettings().services ?? [];

    // --- per-service health -> status ------------------------------------------------------
    // monerod answers get_info over local JSON-RPC. Raw http (not global fetch) so the Tor
    // request interceptor never routes this loopback health check through the network.
    const queryMonerodStatus = (targetPort: number) =>
        new Promise<TotemServiceStatus>(resolve => {
            const body = JSON.stringify({ jsonrpc: '2.0', id: '0', method: 'get_info' });
            const req = http.request(
                {
                    host: '127.0.0.1',
                    port: targetPort,
                    path: '/json_rpc',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(body),
                    },
                    timeout: MONEROD_STATUS_TIMEOUT,
                },
                res => {
                    let data = '';
                    res.on('data', chunk => (data += chunk));
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(data)?.result?.synchronized ? 'active' : 'pending');
                        } catch {
                            resolve('pending');
                        }
                    });
                },
            );
            req.on('error', () => resolve('non-active'));
            req.on('timeout', () => {
                req.destroy();
                resolve('non-active');
            });
            req.write(body);
            req.end();
        });

    const getServiceStatus = (service: TotemService): Promise<TotemServiceStatus> => {
        if (!service.enabled) return Promise.resolve('non-active');
        if (service.id === 'xmr') return queryMonerodStatus(service.targetPort);

        return Promise.resolve('non-active');
    };

    const getServiceStates = (): Promise<TotemServiceState[]> =>
        Promise.all(
            getServices().map(async s => ({
                id: s.id,
                virtualPort: s.virtualPort,
                enabled: s.enabled,
                status: await getServiceStatus(s),
            })),
        );

    // --- manifest (discovery) endpoint -----------------------------------------------------
    // Members probe http://<onion>:MANIFEST_VIRTUAL_PORT/ to learn which services a totem
    // offers and their state. Open in the PoC (no auth); only the discovery list is served.
    let manifestServer: http.Server | null = null;
    let manifestPort = 0;

    const startManifestServer = async () => {
        if (manifestServer) return manifestPort;
        const [freePort] = await getFreePort(1);
        manifestPort = freePort ?? 0;
        const server = http.createServer((req, res) => {
            // The member probes this from the renderer (a different origin), so the response must
            // carry CORS headers or the browser rejects the read as "Failed to fetch".
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (req.method === 'OPTIONS') {
                res.writeHead(204).end();

                return;
            }
            if (req.method !== 'GET') {
                res.writeHead(405).end();

                return;
            }
            getServiceStates().then(services => {
                // Members only see services the keeper actually published.
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ services: services.filter(s => s.enabled) }));
            });
        });
        // Only publish the reference on a successful listen, so a bind failure doesn't wedge later
        // retries with a stale dead server.
        await new Promise<void>((resolve, reject) => {
            server.once('error', reject);
            server.listen(manifestPort, '127.0.0.1', resolve);
        });
        manifestServer = server;

        return manifestPort;
    };

    const stopManifestServer = () =>
        new Promise<void>(resolve => {
            if (!manifestServer) {
                resolve();

                return;
            }
            manifestServer.close(() => resolve());
            manifestServer = null;
        });

    // --- onion lifecycle -------------------------------------------------------------------
    // Expand a 32-byte seed into a Tor ED25519-V3 key blob: base64 of the 64-byte expanded
    // secret key = clamped SHA-512(seed). Tor derives the public key + .onion itself, so there
    // is no curve math here and no extra dependency.
    const deriveOnionKeyBlob = (seedHex: string) => {
        const seed = Buffer.from(seedHex, 'hex');
        if (seed.length !== 32) throw new Error('Totem onion seed must be 32 bytes');
        const h = createHash('sha512').update(seed).digest();
        h.writeUInt8(h.readUInt8(0) & 248, 0);
        h.writeUInt8((h.readUInt8(31) & 127) | 64, 31);

        return h.toString('base64');
    };

    // (Re)publish the onion with the current set of enabled services + the manifest. ADD_ONION
    // cannot add ports to a live service, so we tear down and recreate; the deterministic key
    // keeps the .onion address stable across rebuilds.
    const republishOnion = async () => {
        const controller = getTorController();
        if (!controller) {
            // getTorController is null both when Tor is off and when external Tor is used
            // (external Tor has no control port, so onion services are impossible).
            throw new Error(
                store.getTorSettings().useExternalTor
                    ? 'Totem requires the built-in Tor (external Tor has no control port for onion services)'
                    : 'Totem requires the built-in Tor to be enabled',
            );
        }

        const { keyBlob, serviceId } = store.getTotemSettings();
        if (!keyBlob) throw new Error('Totem is not provisioned yet');

        if (serviceId) {
            await controller.removeOnion(serviceId).catch(() => undefined);
        }

        const localManifestPort = await startManifestServer();
        const ports: OnionPortMapping[] = [
            { virtualPort: MANIFEST_VIRTUAL_PORT, targetPort: localManifestPort },
            ...getServices()
                .filter(s => s.enabled)
                .map(s => ({ virtualPort: s.virtualPort, targetPort: s.targetPort })),
        ];

        const result = await controller.addOnion(keyBlob, ports);
        if (!result.success) {
            throw new Error(`Failed to publish onion service: ${result.payload}`);
        }

        const address = `${result.serviceId}.onion`;
        store.setTotemSettings({ serviceId: result.serviceId, address });
        logger.info(SERVICE_NAME, `Onion published at ${address}`);

        return address;
    };

    const unpublishOnion = async () => {
        const { serviceId } = store.getTotemSettings();
        if (serviceId) {
            const controller = getTorController();
            await controller?.removeOnion(serviceId).catch(() => undefined);
            store.setTotemSettings({ serviceId: undefined, address: undefined });
        }
        await stopManifestServer();
    };

    // --- member side: probe another totem's manifest -------------------------------------
    // Runs in the MAIN process (not the renderer) so it isn't blocked by browser CORS /
    // mixed-content rules on http://<onion>. The interceptor blocks non-whitelisted hosts while
    // Tor is on, so whitelist the onion first; a plain http.request is then routed through Tor
    // automatically (the same path coinjoin / custom backends use to reach .onion).
    const probeManifest = (onion: string) =>
        new Promise<TotemServiceState[]>((resolve, reject) => {
            mainThreadEmitter.emit('module/request-interceptor', {
                type: 'ADD_WHITELISTED_DOMAIN',
                domain: onion,
            });

            const req = http.request(
                `http://${onion}:${MANIFEST_VIRTUAL_PORT}/`,
                { timeout: 20_000 },
                res => {
                    let data = '';
                    res.on('data', chunk => (data += chunk));
                    res.on('end', () => {
                        try {
                            const parsed = JSON.parse(data);
                            resolve(Array.isArray(parsed?.services) ? parsed.services : []);
                        } catch {
                            reject(new Error('Invalid manifest response'));
                        }
                    });
                },
            );
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(
                    new Error('Totem did not respond — it may still be publishing, or unreachable'),
                );
            });
            req.end();
        });

    const emitStatus = async (type: TotemStatus, message?: string) => {
        const { address } = store.getTotemSettings();
        // Omit services for non-Enabled statuses (rather than sending []) so a transient
        // Provisioning/Error event doesn't wipe the keeper's rendered service registry.
        const services = type === 'Enabled' ? await getServiceStates() : undefined;
        win()?.webContents.send('totem/status', { type, address, services, message });
    };

    // --- IPC -------------------------------------------------------------------------------
    ipcMain.handle('totem/provision', async (ipcEvent, { seedHex }: { seedHex: string }) => {
        validateIpcMessage({ ipcEvent });

        try {
            const keyBlob = deriveOnionKeyBlob(seedHex);
            store.setTotemSettings({ keyBlob, running: true });
            await emitStatus('Provisioning');
            const address = await republishOnion();
            await emitStatus('Enabled');

            return { success: true, payload: { address } };
        } catch (error) {
            logger.error(SERVICE_NAME, `Provision failed: ${error.message}`);
            captureException(error);
            await emitStatus('Error', error.message);

            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('totem/toggle', async (ipcEvent, shouldEnable: boolean) => {
        validateIpcMessage({ ipcEvent });
        logger.info(SERVICE_NAME, `Toggling ${shouldEnable ? 'ON' : 'OFF'}`);

        try {
            if (shouldEnable) {
                if (!store.getTotemSettings().keyBlob) {
                    throw new Error('Totem must be provisioned before it can be raised');
                }
                store.setTotemSettings({ running: true });
                await emitStatus('Provisioning');
                await republishOnion();
                await emitStatus('Enabled');
            } else {
                store.setTotemSettings({ running: false });
                await unpublishOnion();
                await emitStatus('Disabled');
            }

            return { success: true };
        } catch (error) {
            captureException(error);
            await emitStatus('Error', error.message);

            return { success: false, error: error.message };
        }
    });

    ipcMain.handle(
        'totem/set-service',
        async (ipcEvent, { id, enabled }: { id: string; enabled: boolean }) => {
            validateIpcMessage({ ipcEvent });

            try {
                const services = getServices().map(s => (s.id === id ? { ...s, enabled } : s));
                store.setTotemSettings({ services });

                const { running } = store.getTotemSettings();
                if (running) await republishOnion();
                await emitStatus(running ? 'Enabled' : 'Disabled');

                return { success: true };
            } catch (error) {
                captureException(error);
                await emitStatus('Error', error.message);

                return { success: false, error: error.message };
            }
        },
    );

    ipcMain.handle('totem/get-settings', async ipcEvent => {
        validateIpcMessage({ ipcEvent });
        const { running, keyBlob, address } = store.getTotemSettings();
        const services = running
            ? await getServiceStates()
            : getServices().map(s => ({
                  id: s.id,
                  virtualPort: s.virtualPort,
                  enabled: s.enabled,
                  status: 'non-active' as const,
              }));

        return {
            success: true,
            payload: { running, provisioned: Boolean(keyBlob), address, services },
        };
    });

    ipcMain.handle('totem/probe', async (ipcEvent, { onion }: { onion: string }) => {
        validateIpcMessage({ ipcEvent });
        if (!/^[a-z2-7]{56}\.onion$/.test(onion)) {
            return { success: false, error: 'Invalid v3 .onion address' };
        }
        try {
            const services = await probeManifest(onion);

            return { success: true, payload: { services } };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.on('totem/get-status', async () => {
        const { running } = store.getTotemSettings();
        await emitStatus(running ? 'Enabled' : 'Disabled');
    });

    // Republish once Tor comes up (app launch / Tor re-enable). When Tor goes down the onion is
    // gone, so forget the stale serviceId to force a rebuild next time Tor is ready.
    mainThreadEmitter.on('module/tor-status-update', async torStatus => {
        const { running, keyBlob, serviceId } = store.getTotemSettings();

        if (torStatus === TorStatus.Disabled) {
            if (serviceId) {
                store.setTotemSettings({ serviceId: undefined, address: undefined });
                await stopManifestServer();
                if (running) await emitStatus('Provisioning', 'Waiting for Tor');
            }

            return;
        }

        if (torStatus === TorStatus.Enabled && running && keyBlob && !serviceId) {
            try {
                await republishOnion();
                await emitStatus('Enabled');
            } catch (error) {
                logger.error(SERVICE_NAME, `Auto-republish failed: ${error.message}`);
            }
        }
    });

    return { dispose: unpublishOnion };
};

type TotemModule = (dependencies: Dependencies) => {
    onLoad: () => void;
    onQuit: () => Promise<void>;
};

export const init: TotemModule = dependencies => {
    let loaded = false;
    let dispose: (() => Promise<void>) | undefined;

    const onLoad = () => {
        if (loaded) return;
        loaded = true;
        ({ dispose } = load(dependencies));
    };

    const onQuit = async () => {
        const { logger } = global;
        logger.info(SERVICE_NAME, 'Stopping (app quit)');
        await dispose?.();
    };

    return { onLoad, onQuit };
};
