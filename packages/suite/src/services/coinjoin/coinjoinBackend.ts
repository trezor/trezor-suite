import { CoinjoinBackend } from '@trezor/coinjoin';
import { createIpcProxy } from '@trezor/ipc-proxy';
import TrezorConnect, { AccountInfo } from '@trezor/connect';
import { isDesktop } from '@suite-utils/env';
import { COINJOIN_NETWORKS } from './config';

const loadInstance = (network: string) => {
    const settings = COINJOIN_NETWORKS[network];
    if (isDesktop()) {
        return createIpcProxy<CoinjoinBackend>(
            'CoinjoinBackend',
            { target: { settings } },
            settings,
        );
    }
    return import(/* webpackChunkName: "coinjoin" */ '@trezor/coinjoin').then(
        pkg => new pkg.CoinjoinBackend(settings),
    );
};

// NOTE: blockbook does not understand 4th hardended field in path (slip25 script type) and returns error: "Invalid address, decoded address is of unknown format"
// temporary replace SLIP-25 path with taproot path
const slip25Path = "/10025'/1'/0'/1'";
const taprootPath = "/86'/1'/0'";

const blockbookPatchResponse = (accountInfo: AccountInfo) => {
    const { addresses } = accountInfo;
    if (!addresses) return accountInfo;

    const patchAddresses: AccountInfo['addresses'] = {
        used: [],
        unused: [],
        change: [],
    };
    const replace = (path: string) => {
        if (!path.includes('unknown')) return { isChange: false, path };
        const pathParts = path.split('/');
        return {
            path: path.replace('unknown', "m/10025'/1'/0'"),
            isChange: pathParts[pathParts.length - 2] === '1',
        };
    };

    addresses.used.forEach(a => {
        const { path, isChange } = replace(a.path);
        if (isChange) {
            patchAddresses.change.push({ ...a, path });
        } else {
            patchAddresses.used.push({ ...a, path });
        }
    });
    addresses.unused.forEach(a => {
        const { path, isChange } = replace(a.path);
        if (isChange) {
            patchAddresses.change.push({ ...a, path });
        } else {
            patchAddresses.unused.push({ ...a, path });
        }
    });
    accountInfo.utxo = accountInfo.utxo?.map(utxo => {
        const { path } = replace(utxo.path);
        return { ...utxo, path };
    });

    return {
        ...accountInfo,
        descriptor: accountInfo.descriptor.replace(taprootPath, slip25Path),
        addresses: patchAddresses,
    };
};

// NOTE: function below will be replaced by @trezor/coinjoin implementation
type GetAccountInfoParams = {
    descriptor: string;
    lastKnownState?: {
        balance: string;
        blockHash: string;
    };
    symbol: string;
    onProgress: (state: any) => void;
};

const getCoinjoinAccountInfo = async (
    { descriptor, symbol, lastKnownState }: GetAccountInfoParams,
    onProgress: (...args: any[]) => any,
    abortSignal: AbortSignal,
) => {
    const accountInfo = await TrezorConnect.getAccountInfo({
        descriptor: descriptor.replace(slip25Path, taprootPath),
        coin: symbol,
        details: 'txs',
    });

    if (!accountInfo.success) {
        console.log('No accountInfo');
        return;
    }

    if (lastKnownState?.blockHash === '11') {
        return blockbookPatchResponse(accountInfo.payload);
    }

    return new Promise<typeof accountInfo.payload>(resolve => {
        // simulate account discovery by block filters
        let i = !lastKnownState?.blockHash ? 0 : 70;
        let timeout: ReturnType<typeof setTimeout>;
        const tick = () => {
            i += 10;
            if (i < 100) {
                onProgress({
                    blockHash: `0${i}`,
                    progress: i,
                    progressMessage:
                        i > 60 ? 'Checking transaction history' : 'Loading block filters',
                });
                timeout = setTimeout(tick, 1000);
            } else {
                // Finish loading
                onProgress({
                    blockHash: '11',
                });
                resolve(blockbookPatchResponse(accountInfo.payload));
            }
        };
        tick();

        abortSignal.addEventListener('abort', () => {
            console.warn('ABORTED!');
            clearTimeout(timeout);
        });
    });
};

export class CoinjoinBackendService {
    private static instances: Record<string, CoinjoinBackend> = {};

    static async createInstance(network: string) {
        if (this.instances[network]) return this.instances[network];
        const instance = await loadInstance(network);
        // NOTE: temporary use blockbook implementation
        // @ts-expect-error
        instance.getAccountInfo = (params: GetAccountInfoParams) => {
            const abortController = new AbortController();
            return getCoinjoinAccountInfo(
                params,
                (progress: any) => {
                    instance.emit('progress', progress);
                },
                abortController.signal,
            );
        };
        this.instances[network] = instance;
        return instance;
    }

    static getInstance(network: string): CoinjoinBackend | undefined {
        return this.instances[network];
    }

    static getInstances() {
        return Object.keys(this.instances).map(key => this.instances[key]);
    }
}
