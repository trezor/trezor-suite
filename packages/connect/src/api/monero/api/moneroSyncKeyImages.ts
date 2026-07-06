// Sync the wallet's key images with the device, so a view-only Monero wallet learns which of its
// outputs were spent and can show outgoing / self transactions and a correct balance.
//
// A view-only wallet (the scanning backend) cannot compute key images — those need the spend key,
// which only the device holds. This method exports a key image (+ spend signature) for EVERY owned
// output from the device (moneroKeyImageSync), then imports them into the scanning wallet
// (wallet2 import_key_images). After the import the wallet marks spent outputs and reconstructs the
// outgoing transfers, so the history reclassifies receives/sends/self correctly. This mirrors how
// monero-gui + Trezor keeps a hardware wallet's history and balance accurate.
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { HD_HARDENED_PATH_PART } from '@trezor/crypto-utils';
import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { initBlockchain, isBackendSupported } from '../../../backend/BlockchainLink';
import type { MethodContext, MethodMessage, MethodReturnType } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getCoinInfo, getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import { validateParams } from '../../common/paramsValidator';
import { runMoneroKeyImageSync } from '../device/keyImageSyncProtocol';
import { buildTransferDetails } from '../send/transferDetails';
import { MoneroDaemonRpc } from '../tx/daemonRpc';
import { decryptKeyImages } from '../tx/decryptKeyImages';
import { gatherSpendableInputs } from '../tx/gatherInputs';
import { bytesToHex } from '../tx/hex';
import { toKeyImageInput } from '../tx/sendMoneroTransaction';

type Params = {
    address_n: number[];
    network_type: PROTO.MoneroNetworkType;
    coinInfo: CoinInfo;
    descriptor: string;
    account: number;
    identity?: string;
    // Pre-exported key images (from a just-completed send). Present → device-free import; absent →
    // export from the device.
    keyImages?: { keyImage: string; signature: string }[];
};

export default class MoneroSyncKeyImagesMethod extends AbstractMethod<
    'moneroSyncKeyImages',
    Params
> {
    constructor(message: MethodMessage<'moneroSyncKeyImages'>) {
        const { payload } = message;

        validateParams(payload, [
            { name: 'path', required: true },
            { name: 'coin', type: 'string' },
            { name: 'descriptor', type: 'string', required: true },
            { name: 'account', type: 'number' },
            { name: 'identity', type: 'string' },
            { name: 'keyImages', type: 'array' },
        ]);

        const path = validatePath(payload.path, 3);
        const allHardened = path.every(component => (component & HD_HARDENED_PATH_PART) !== 0);
        if (!allHardened) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Monero requires all path components to be hardened. Use m/44'/128'/0' format.`,
            );
        }

        const coinInfo = getCoinInfo(payload.coin || 'xmr');
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        isBackendSupported(coinInfo);

        super(message, {
            address_n: path,
            network_type: PROTO.MoneroNetworkType.MAINNET,
            coinInfo,
            descriptor: payload.descriptor,
            account: payload.account ?? 0,
            identity: payload.identity,
            keyImages: payload.keyImages,
        });

        // Device-free when the caller hands over pre-exported key images (the after-send path reuses
        // the export the send already did) — no device acquisition, no UI/permission prompt. Without
        // them this is the standalone sync that exports from the device.
        const deviceFree = Array.isArray(payload.keyImages);
        this.useDevice = !deviceFree;
        this.useDeviceState = !deviceFree;
        this.useUi = !deviceFree;
        if (!deviceFree) {
            this.requiredDeviceCapabilities = ['Capability_Monero'];
            this.requiredFirmwareCoins = [getMiscNetwork('Monero')];
        }
    }

    get requiredPermissions(): PermissionRequest[] {
        // The device-free import touches no device, so it needs no device permission.
        return this.params.keyImages
            ? []
            : this.coinPerms('read_account_info', this.requiredFirmwareCoins);
    }

    get info() {
        return 'Sync Monero key images';
    }

    async run(context: MethodContext): Promise<MethodReturnType<typeof this.name>> {
        const { coinInfo, descriptor } = this.params;

        const blockchain = await initBlockchain(
            coinInfo,
            context.sendCoreMessage,
            this.params.identity,
        );

        // Device-free path: the send already exported these key images on the device this turn. Import
        // them straight into the scanning wallet — no device, no second key-image-sync round-trip.
        const preExported = this.params.keyImages;
        if (preExported) {
            if (preExported.length === 0) {
                return { imported: 0 };
            }
            await blockchain.getAccountInfo({
                descriptor,
                details: 'basic',
                monero: { importKeyImages: preExported },
            });

            return { imported: preExported.length };
        }

        // Standalone sync: export every owned output's key image from the device, then import.
        const { address_n, network_type, account } = this.params;
        const commands = this.getDevice().getCommands();

        // ALL owned outputs (spent + unspent + locked) in the wallet's transfer order — the device
        // must export a key image for every one of them, positionally (wallet2 import order).
        const info = await blockchain.getAccountInfo({
            descriptor,
            details: 'basic',
            monero: { gatherOutputs: true, allOutputs: true },
        });
        const walletOutputs = info.misc?.moneroOutputs;
        const viewKey = info.misc?.moneroPrivateViewKey;
        if (!walletOutputs || walletOutputs.length === 0) {
            return { imported: 0 };
        }
        if (!viewKey) {
            throw ERRORS.TypedError(
                'Runtime',
                'moneroSyncKeyImages: the scanning wallet did not provide a view key',
            );
        }

        const url = coinInfo.blockchainLink?.url?.[0];
        if (!url) {
            throw ERRORS.TypedError('Backend_NotSupported');
        }
        const daemon = new MoneroDaemonRpc(url);

        // Resolve each output's tx public key + in-tx index (the device needs them to derive the key
        // image), preserving the transfer order, then export the key images from the device.
        const resolved = await gatherSpendableInputs(walletOutputs, daemon, viewKey);
        const result = await runMoneroKeyImageSync(commands, {
            address_n,
            network_type,
            subs: [],
            tdis: buildTransferDetails(resolved.map(toKeyImageInput(account))),
        });

        // Decrypt the key images + their spend signatures (import_key_images verifies the signature).
        const keyImages = decryptKeyImages(
            result.signature,
            result.key_images.map(ki => ({ iv: ki.iv, blob: ki.key_image })),
        ).map(decrypted => ({
            keyImage: bytesToHex(decrypted.keyImage),
            signature: bytesToHex(decrypted.signature),
        }));

        // Import into the scanning wallet: marks spent outputs, reconstructs outgoing/self transfers,
        // corrects the balance, and persists. The next account refresh shows the reclassified history.
        await blockchain.getAccountInfo({
            descriptor,
            details: 'basic',
            monero: { importKeyImages: keyImages },
        });

        return { imported: keyImages.length };
    }
}
