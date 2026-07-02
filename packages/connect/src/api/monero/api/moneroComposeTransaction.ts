// Estimate a Monero transaction's fee for the send form — without touching the device.
//
// The fee depends on the number of inputs the transaction will spend, which depends on the amount and
// the wallet's (possibly many small) outputs. A fixed one-input estimate is wrong for a wallet of
// dust, letting the form commit to an amount the real transaction can't cover. This runs the SAME
// gather + input-selection + fee logic the send uses, so the previewed fee matches what is actually
// spent and the form can reject an unaffordable amount up front.
import type { CoinInfo, PermissionRequest } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';

import { initBlockchain, isBackendSupported } from '../../../backend/BlockchainLink';
import type { MethodContext, MethodMessage, MethodReturnType } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getCoinInfo } from '../../../data/coinInfo';
import { validateParams } from '../../common/paramsValidator';
import { MoneroDaemonRpc } from '../tx/daemonRpc';
import { estimateMoneroFee } from '../tx/estimateFee';
import { selectInputs } from '../tx/selectInputs';

const DEFAULT_RING_SIZE = 16;

// Upper-bound tx_extra estimate (tx pubkey + nonce + per-output additional pubkeys); biasing high
// keeps the fee from ever being under-set. Mirrors sendMoneroTransaction.
const extraSizeEstimate = (numOutputs: number) => 44 + 33 * numOutputs;

type Params = {
    coinInfo: CoinInfo;
    descriptor: string;
    destinations: { address: string; amount: number }[];
    isMax: boolean;
    account: number;
    ringSize: number;
    identity?: string;
};

const toAmount = (value: string): number => {
    const amount = Number(value);
    if (!Number.isSafeInteger(amount) || amount < 0) {
        throw ERRORS.TypedError(
            'Method_InvalidParameter',
            `moneroComposeTransaction: amount ${value} is out of range`,
        );
    }

    return amount;
};

export default class MoneroComposeTransactionMethod extends AbstractMethod<
    'moneroComposeTransaction',
    Params
> {
    constructor(message: MethodMessage<'moneroComposeTransaction'>) {
        const { payload } = message;

        validateParams(payload, [
            { name: 'coin', type: 'string' },
            { name: 'descriptor', type: 'string', required: true },
            { name: 'destinations', type: 'array', required: true },
            { name: 'isMax', type: 'boolean' },
            { name: 'account', type: 'number' },
            { name: 'ringSize', type: 'number' },
            { name: 'identity', type: 'string' },
        ]);

        const destinations = payload.destinations.map(destination => {
            validateParams(destination, [
                { name: 'address', type: 'string', required: true },
                { name: 'amount', type: 'string', required: true },
            ]);

            // A send-max preview has no amount yet (0 is fine); the real amount is computed here.
            return { address: destination.address, amount: toAmount(destination.amount) };
        });

        const coinInfo = getCoinInfo(payload.coin || 'xmr');
        if (!coinInfo) {
            throw ERRORS.TypedError('Method_UnknownCoin');
        }
        isBackendSupported(coinInfo);

        super(message, {
            coinInfo,
            descriptor: payload.descriptor,
            destinations,
            isMax: payload.isMax ?? false,
            account: payload.account ?? 0,
            ringSize: payload.ringSize ?? DEFAULT_RING_SIZE,
            identity: payload.identity,
        });

        // Fee estimation only — the scanning wallet already holds the view key, so no device is used.
        this.useDevice = false;
        this.useDeviceState = false;
        this.useUi = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        // Read-only fee estimation; no device interaction, so no permissions are requested.
        return [];
    }

    get info() {
        return 'Estimate Monero transaction fee';
    }

    async run(context: MethodContext): Promise<MethodReturnType<typeof this.name>> {
        const { coinInfo, descriptor, ringSize } = this.params;

        const blockchain = await initBlockchain(
            coinInfo,
            context.sendCoreMessage,
            this.params.identity,
        );
        const info = await blockchain.getAccountInfo({
            descriptor,
            details: 'basic',
            monero: { gatherOutputs: true },
        });
        const walletOutputs = info.misc?.moneroOutputs ?? [];

        const url = coinInfo.blockchainLink?.url?.[0];
        if (!url) {
            throw ERRORS.TypedError('Backend_NotSupported');
        }
        const feeEstimate = await new MoneroDaemonRpc(url).getFeeEstimate();

        // A send-max splits the destination into two outputs (Monero needs ≥ 2 and there is no
        // change); a normal send is destinations + a change output.
        const numOutputs = this.params.destinations.length + 1;
        const estimateFee = (numInputs: number) =>
            estimateMoneroFee({
                numInputs,
                numOutputs,
                ringSize,
                extraSize: extraSizeEstimate(numOutputs),
                baseFeePerByte: feeEstimate.baseFeePerByte,
                quantizationMask: feeEstimate.quantizationMask,
            });

        const spendable = walletOutputs.map(output => ({ amount: toAmount(output.amount) }));
        const total = spendable.reduce((sum, output) => sum + output.amount, 0);
        // The most a single transaction can send: spend everything, minus the fee for spending it all.
        const maxFee = spendable.length > 0 ? estimateFee(spendable.length) : 0;
        const max = Math.max(0, total - maxFee);

        if (this.params.isMax) {
            return { fee: maxFee.toString(), sufficient: max > 0, max: max.toString() };
        }

        const sendTotal = this.params.destinations.reduce((sum, dest) => sum + dest.amount, 0);
        try {
            const { fee } = selectInputs(spendable, sendTotal, estimateFee);

            return { fee: fee.toString(), sufficient: true, max: max.toString() };
        } catch {
            // The amount + its (input-count dependent) fee exceeds the spendable outputs.
            return { fee: maxFee.toString(), sufficient: false, max: max.toString() };
        }
    }
}
