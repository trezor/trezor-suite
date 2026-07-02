// Send Monero: the host-side orchestration that turns a spend request into a relayed transaction.
//
// It gathers the account's spendable outputs from the scanning backend, sizes the fee against the
// local daemon, then drives the device (key-image sync + the 8-step sign protocol) and assembles +
// relays the result. All the deterministic pieces are unit-tested (see tx/*.test.ts); this method
// wires them to the live device, daemon and backend and is validated on hardware.
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { HD_HARDENED_PATH_PART } from '@trezor/crypto-utils';
import { MessagesSchema as PROTO } from '@trezor/protobuf';

import { assertBackendSupported, initBlockchain } from '../../../backend/BlockchainLink';
import type { MethodContext, MethodMessage, MethodReturnType } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getCoinInfoOrThrow, getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import { validateParams } from '../../common/paramsValidator';
import { makeDeviceSigner, makeKeyImageProvider } from '../send/deps';
import { MoneroDaemonRpc } from '../tx/daemonRpc';
import { GammaPicker } from '../tx/decoy';
import { bytesToHex } from '../tx/hex';
import { sendMoneroTransaction } from '../tx/sendMoneroTransaction';

const DEFAULT_RING_SIZE = 16;

type Destination = { address: string; amount: number };

type Params = {
    address_n: number[];
    network_type: PROTO.MoneroNetworkType;
    coinInfo: CoinInfo;
    descriptor: string;
    destinations: Destination[];
    account: number;
    ringSize: number;
    isMax: boolean;
    doNotRelay: boolean;
    identity?: string;
};

// Piconero amounts arrive as decimal strings; the pipeline works in JS numbers (matching the
// Type.Uint protobuf fields), so reject an out-of-range amount instead of losing precision.
const toAmount = (value: string): number => {
    const amount = Number(value);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            `moneroSendTransaction: amount ${value} must be a positive integer below 2^53 piconero`,
        );
    }

    return amount;
};

export default class MoneroSendTransactionMethod extends AbstractMethod<
    'moneroSendTransaction',
    Params
> {
    constructor(message: MethodMessage<'moneroSendTransaction'>) {
        const { payload } = message;

        validateParams(payload, [
            { name: 'path', required: true },
            { name: 'coin', type: 'string' },
            { name: 'descriptor', type: 'string', required: true },
            { name: 'destinations', type: 'array', required: true },
            { name: 'account', type: 'number' },
            { name: 'ringSize', type: 'number' },
            { name: 'isMax', type: 'boolean' },
            { name: 'doNotRelay', type: 'boolean' },
            { name: 'identity', type: 'string' },
        ]);

        const path = validatePath(payload.path, 3);
        const allHardened = path.every(component => (component & HD_HARDENED_PATH_PART) !== 0);
        if (!allHardened) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                `Monero requires all path components to be hardened. Use m/44'/128'/0' format.`,
            );
        }

        if (payload.destinations.length === 0) {
            throw ERRORS.TypedError(
                'Method_InvalidParameter',
                'At least one destination is required',
            );
        }
        const destinations = payload.destinations.map(destination => {
            validateParams(destination, [
                { name: 'address', type: 'string', required: true },
                { name: 'amount', type: 'string', required: true },
            ]);

            return { address: destination.address, amount: toAmount(destination.amount) };
        });

        const coinInfo = getCoinInfoOrThrow(payload.coin || 'xmr');
        assertBackendSupported(coinInfo);

        super(message, {
            address_n: path,
            network_type: PROTO.MoneroNetworkType.MAINNET,
            coinInfo,
            descriptor: payload.descriptor,
            destinations,
            account: payload.account ?? 0,
            ringSize: payload.ringSize ?? DEFAULT_RING_SIZE,
            isMax: payload.isMax ?? false,
            doNotRelay: payload.doNotRelay ?? false,
            identity: payload.identity,
        });

        this.useDevice = true;
        this.useDeviceState = true;
        this.useUi = true;
        this.requiredDeviceCapabilities = ['Capability_Monero'];
        this.requiredFirmwareCoins = [getMiscNetwork('xmr')];
    }

    get requiredPermissions(): PermissionRequest[] {
        return this.coinPerms('sign', this.requiredFirmwareCoins);
    }

    get info() {
        return 'Send Monero transaction';
    }

    async run(context: MethodContext): Promise<MethodReturnType<typeof this.name>> {
        const { address_n, network_type, coinInfo, descriptor } = this.params;
        const commands = this.getDevice().getCommands();

        // List the account's spendable outputs. No view-key prompt: the scanning wallet already holds
        // the view key (cached from the scan, or read from its own keys file after a restart), so the
        // backend gathers from it directly.
        const blockchain = await initBlockchain(
            coinInfo,
            context.sendCoreMessage,
            this.params.identity,
        );
        // ALL owned outputs (spent + unspent + locked) in the wallet's transfer order. The send filters
        // down to spendable itself; the full set is what the device exports key images for (one
        // round-trip) and what the after-send import needs positionally.
        const info = await blockchain.getAccountInfo({
            descriptor,
            details: 'txs',
            monero: { gatherOutputs: true, allOutputs: true },
        });
        const walletOutputs = info.misc?.moneroOutputs;
        if (!walletOutputs || walletOutputs.length === 0) {
            throw ERRORS.TypedError(
                'Runtime',
                'moneroSendTransaction: no spendable outputs (account not synced or empty)',
            );
        }
        // The view key (held by the scanning wallet) is needed to derive each input's commitment mask,
        // which the device verifies against the on-chain commitment when signing.
        const viewKey = info.misc?.moneroPrivateViewKey;
        if (!viewKey) {
            throw ERRORS.TypedError(
                'Runtime',
                'moneroSendTransaction: the scanning wallet did not provide a view key',
            );
        }

        const url = coinInfo.blockchainLink?.url?.[0];
        if (!url) {
            throw ERRORS.TypedError('Backend_NotSupported');
        }
        const daemon = new MoneroDaemonRpc(url);

        // Gamma decoy selection over the chain's RingCT output distribution + the current fee rate.
        // amount=0 => the RingCT-only output distribution GammaPicker expects; from_height=0 => the
        // returned `base` is 0 and `.distribution` is the full cumulative offset array.
        const distribution = await daemon.getOutputDistribution(0, 0);
        const picker = new GammaPicker(distribution.distribution);
        const feeEstimate = await daemon.getFeeEstimate();

        const result = await sendMoneroTransaction({
            walletOutputs,
            viewKey,
            destinations: this.params.destinations,
            changeAddress: descriptor,
            account: this.params.account,
            ringSize: this.params.ringSize,
            isMax: this.params.isMax,
            fee: {
                baseFeePerByte: feeEstimate.baseFeePerByte,
                quantizationMask: feeEstimate.quantizationMask,
            },
            doNotRelay: this.params.doNotRelay,
            daemon,
            selectDecoys: (count, realIndex) => picker.selectDecoys(count, realIndex),
            getKeyImages: makeKeyImageProvider(commands, address_n, network_type),
            signer: makeDeviceSigner(commands, address_n, network_type),
        });

        return {
            txHex: result.txHex,
            txKey: '',
            relayed: result.relayed,
            fee: result.fee.toString(),
            change: result.change.toString(),
            // The device exported these while signing; the send form hands them to the after-send
            // import so it doesn't trigger a second key-image-sync device prompt.
            keyImages: result.keyImages.map(ki => ({
                keyImage: bytesToHex(ki.keyImage),
                signature: bytesToHex(ki.signature),
            })),
        };
    }
}
