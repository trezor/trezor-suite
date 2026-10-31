/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */

import { schnorr, secp256k1 } from '@noble/curves/secp256k1.js';
import { createHash, createHmac, randomBytes } from 'crypto';

import { getOutputAmounts } from '@trezor/coinjoin-strategy';
import { networks, payments } from '@trezor/utxo-lib';
import { type Credential, secureRandom } from '@trezor/wabisabi-crypto';

import * as coordinator from '../src/client/coordinator';
import * as credentials from '../src/client/credentials';
import { EndRoundState, RoundPhase } from '../src/enums';
import { type CoinjoinRoundParameters, type Round } from '../src/types/coordinator';
import {
    getInputSize,
    getOutputSize,
    getScriptPubKeyFromAddress,
    getWitnessFromSignature,
    mergePubkeys,
    prefixScriptPubKey,
    readOutpoint,
    sortInputs,
    sortOutputs,
} from '../src/utils/coordinatorUtils';
import { getCommitmentData, getRoundEvents, getRoundParameters } from '../src/utils/roundUtils';

/**
 * A full coinjoin round end to end against the local regtest coordinator.
 *
 * This is the manual QA gate for replacing `WalletWasabi.WabiSabiClientLibrary` with the
 * in-process port: the unit vectors in `@trezor/wabisabi-crypto`,
 * `@trezor/coinjoin-strategy` and `@trezor/coinjoin-analysis` compare *parsed* values, so
 * only a real coordinator proves that what goes on the wire is accepted — PascalCase keys,
 * uppercase hex, a width-42 amount range proof, a vsize range proof, the balance proof and
 * the presentations of previously issued credentials, all verified by the coordinator's own
 * C# `CredentialIssuer`. A correct proof serialized differently is a rejected registration,
 * and nothing but this finds that.
 *
 * Every credential here is produced by `src/client/credentials.ts` and every decomposition
 * by `@trezor/coinjoin-strategy`, i.e. by the same code the desktop client runs. The two
 * things a device would do differently are the ownership proof and the witness: those are
 * ECDSA/Schnorr signatures over locally held regtest keys instead of signatures from a
 * Trezor. Neither is ported code — `transactionSigning.ts` asks the wallet for a witness
 * and passes it through — so the device half adds no coverage of the port.
 *
 * Usage:
 * 1. `./docker/docker-coinjoin-backend.sh`
 * 2. `yarn workspace @trezor/coinjoin test:regtest`
 *
 * Overridable through the environment: `COORDINATOR_URL`, `FAUCET_URL`, `BLOCKBOOK_URL`,
 * `COORDINATOR_NAME`, `INPUT_AMOUNT` (BTC per input), `INPUT_COUNT`.
 *
 * Note for whoever repeats this: the published backend image ships Bitcoin Knots
 * v25.1.knots20231115, whose build expiry has passed, so its `bitcoind` needs
 * `-softwareexpiry=0` to start at all.
 */

const COORDINATOR_URL = process.env.COORDINATOR_URL ?? 'http://127.0.0.1:8081/backend/wabisabi/';
const FAUCET_URL = process.env.FAUCET_URL ?? 'http://127.0.0.1:8080';
const BLOCKBOOK_URL = process.env.BLOCKBOOK_URL ?? 'http://127.0.0.1:19121';
const COORDINATOR_NAME = process.env.COORDINATOR_NAME ?? 'CoinJoinCoordinatorIdentifier';
const INPUT_AMOUNT = process.env.INPUT_AMOUNT ?? '0.2';
// The regtest coordinator's `MinInputCountByRound` is 2, so one input can never complete a
// round. Each input is a separate Alice, as it would be in Suite.
const INPUT_COUNT = Number(process.env.INPUT_COUNT ?? 2);

// Taproot, like Suite's coinjoin accounts: `getOutputAmounts` refuses anything else, and
// a taproot key-spend witness is the single signature chunk `getWitnessFromSignature`
// builds for a Trezor.
const SCRIPT_TYPE = 'Taproot';
const NETWORK = networks.regtest;

const { signal } = new AbortController();
const requestOptions = { signal, baseUrl: COORDINATOR_URL, attempts: 1, timeout: 30_000 };

const log = (message: string) => console.log(message);
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/* --------------------------------------------------------------------------------------
 * Bitcoin serialization, enough of it to compute the two digests a signer needs.
 * ------------------------------------------------------------------------------------ */

const sha256 = (data: Buffer) => createHash('sha256').update(data).digest();
const hash256 = (data: Buffer) => sha256(sha256(data));

/** Bitcoin's CompactSize. Nothing here is ever long enough to need more than 3 bytes. */
const varInt = (value: number) => {
    if (value < 0xfd) return Buffer.from([value]);
    const buffer = Buffer.alloc(3);
    buffer.writeUInt8(0xfd, 0);
    buffer.writeUInt16LE(value, 1);

    return buffer;
};

const varSlice = (data: Buffer) => Buffer.concat([varInt(data.length), data]);

const uint32 = (value: number) => {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(value, 0);

    return buffer;
};

const uint64 = (value: number) => {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(value), 0);

    return buffer;
};

/** BIP-341's tagged hash. */
const taggedHash = (tag: string, data: Buffer) => {
    const tagHash = sha256(Buffer.from(tag, 'utf8'));

    return sha256(Buffer.concat([tagHash, tagHash, data]));
};

const SEQUENCE_FINAL = 0xffffffff;

interface TxInput {
    /** The outpoint's txid in internal (reversed) byte order. */
    hash: Buffer;
    index: number;
    value: number;
    scriptPubKey: Buffer;
}

interface TxOutput {
    value: number;
    scriptPubKey: Buffer;
}

/**
 * `SigningState.CreateUnsignedTransaction`: nVersion 1, nLockTime 0, every nSequence
 * final, inputs and outputs in the coordinator's sort order.
 */
const serializeTransaction = (inputs: TxInput[], outputs: TxOutput[]) =>
    Buffer.concat([
        uint32(1),
        varInt(inputs.length),
        ...inputs.map(input =>
            Buffer.concat([input.hash, uint32(input.index), varInt(0), uint32(SEQUENCE_FINAL)]),
        ),
        varInt(outputs.length),
        ...outputs.map(output =>
            Buffer.concat([uint64(output.value), varSlice(output.scriptPubKey)]),
        ),
        uint32(0),
    ]);

/** BIP-341 key-spend signature hash with SIGHASH_DEFAULT. */
const taprootSignatureHash = (inputs: TxInput[], outputs: TxOutput[], inputIndex: number) => {
    const shaPrevouts = sha256(
        Buffer.concat(inputs.map(input => Buffer.concat([input.hash, uint32(input.index)]))),
    );
    const shaAmounts = sha256(Buffer.concat(inputs.map(input => uint64(input.value))));
    const shaScriptPubKeys = sha256(
        Buffer.concat(inputs.map(input => varSlice(input.scriptPubKey))),
    );
    const shaSequences = sha256(Buffer.concat(inputs.map(() => uint32(SEQUENCE_FINAL))));
    const shaOutputs = sha256(
        Buffer.concat(
            outputs.map(output =>
                Buffer.concat([uint64(output.value), varSlice(output.scriptPubKey)]),
            ),
        ),
    );

    return taggedHash(
        'TapSighash',
        Buffer.concat([
            Buffer.from([0x00]), // sighash epoch
            Buffer.from([0x00]), // SIGHASH_DEFAULT
            uint32(1), // nVersion
            uint32(0), // nLockTime
            shaPrevouts,
            shaAmounts,
            shaScriptPubKeys,
            shaSequences,
            shaOutputs,
            Buffer.from([0x00]), // spend_type: key path, no annex
            uint32(inputIndex),
        ]),
    );
};

/* --------------------------------------------------------------------------------------
 * A throwaway taproot wallet, standing in for the device.
 * ------------------------------------------------------------------------------------ */

interface Wallet {
    /** BIP-86 tweaked secret key: the one that signs for the output key. */
    secretKey: Uint8Array;
    address: string;
    scriptPubKey: Buffer;
}

const bytesToBigInt = (bytes: Uint8Array) => BigInt(`0x${Buffer.from(bytes).toString('hex')}`);
const bigIntToBytes = (value: bigint) =>
    Uint8Array.from(Buffer.from(value.toString(16).padStart(64, '0'), 'hex'));

const createWallet = (): Wallet => {
    const secretKey = secp256k1.utils.randomSecretKey();
    const internalPubKey = schnorr.getPublicKey(secretKey);
    const { address, output } = payments.p2tr({
        pubkey: Buffer.from(internalPubKey),
        network: NETWORK,
    });
    if (!address || !output) throw new Error('p2tr produced no address');

    // BIP-86: the key that signs is the internal key tweaked by t = H_TapTweak(P), with
    // the secret negated first if P has an odd y coordinate.
    const order = secp256k1.Point.Fn.ORDER;
    const point = secp256k1.Point.fromBytes(secp256k1.getPublicKey(secretKey, true));
    const d = point.y % 2n === 0n ? bytesToBigInt(secretKey) : order - bytesToBigInt(secretKey);
    const tweak = bytesToBigInt(taggedHash('TapTweak', Buffer.from(internalPubKey)));

    return { secretKey: bigIntToBytes((d + tweak) % order), address, scriptPubKey: output };
};

/** BIP-340 over a 32-byte digest, which is what both of a round's signatures are. */
const sign = (wallet: Wallet, digest: Buffer) =>
    Buffer.from(schnorr.sign(digest, wallet.secretKey, new Uint8Array(32)));

/**
 * SLIP-0019 ownership proof, as `WalletWasabi/Crypto/{OwnershipProof,ProofBody,
 * Bip322Signature}.cs` builds and the coordinator verifies it.
 *
 * The coordinator checks the UserConfirmation flag and the signature; the ownership
 * identifier is opaque to it, so a random identification key stands in for the device's.
 */
const getOwnershipProof = (wallet: Wallet, commitmentData: Buffer) => {
    const ownershipId = createHmac('sha256', randomBytes(32)).update(wallet.scriptPubKey).digest();
    const proofBody = Buffer.concat([
        Buffer.from([0x53, 0x4c, 0x00, 0x19]), // SLIP-0019 version magic
        Buffer.from([0x01]), // ProofBodyFlags.UserConfirmation
        varInt(1),
        ownershipId,
    ]);
    const signatureHash = sha256(
        Buffer.concat([proofBody, varSlice(wallet.scriptPubKey), varSlice(commitmentData)]),
    );
    const signature = sign(wallet, signatureHash);

    // Bip322Signature: an empty scriptSig followed by the witness.
    return Buffer.concat([proofBody, varInt(0), varInt(1), varSlice(signature)]).toString('hex');
};

/* --------------------------------------------------------------------------------------
 * The regtest backend's faucet and blockbook.
 * ------------------------------------------------------------------------------------ */

interface Utxo {
    txid: string;
    vout: number;
    value: number;
}

const fundAddress = async (address: string) => {
    const body = new URLSearchParams({ amount: INPUT_AMOUNT, address });
    const response = await fetch(`${FAUCET_URL}/send_to_address`, {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
    });
    if (!response.ok) {
        throw new Error(`Faucet refused to fund ${address}: ${response.statusText}`);
    }
};

const generateBlock = async () => {
    const response = await fetch(`${FAUCET_URL}/generate_block`);
    if (!response.ok) throw new Error(`Faucet refused to generate a block: ${response.statusText}`);
};

const waitForUtxo = async (address: string): Promise<Utxo> => {
    for (let attempt = 0; attempt < 30; attempt++) {
        const response = await fetch(`${BLOCKBOOK_URL}/api/v2/utxo/${address}`);
        const utxos: { txid: string; vout: number; value: string; confirmations: number }[] =
            await response.json();
        const confirmed = utxos.find(utxo => utxo.confirmations > 0);
        if (confirmed) {
            return { txid: confirmed.txid, vout: confirmed.vout, value: Number(confirmed.value) };
        }
        await delay(2000);
    }

    throw new Error(`No confirmed utxo on ${address}`);
};

const getBroadcastTransaction = async (txid: string) => {
    for (let attempt = 0; attempt < 30; attempt++) {
        const response = await fetch(`${BLOCKBOOK_URL}/api/v2/tx/${txid}`);
        if (response.ok) return response.json();
        await delay(2000);
    }

    throw new Error(`Blockbook does not know ${txid}`);
};

/* --------------------------------------------------------------------------------------
 * The round.
 * ------------------------------------------------------------------------------------ */

/** NBitcoin's OutPoint: the txid in internal byte order, then the index as uint32. */
const getOutpoint = (utxo: Utxo) =>
    Buffer.concat([Buffer.from(utxo.txid, 'hex').reverse(), uint32(utxo.vout)]).toString('hex');

interface Alice {
    wallet: Wallet;
    utxo: Utxo;
    outpoint: string;
    aliceId: string;
    /** Effective value: the input amount less the coordinator and mining fees. */
    amount: number;
    amountCredentials: Credential[];
    vsizeCredentials: Credential[];
    realAmountCredentials: Awaited<ReturnType<typeof credentials.getRealCredentials>>;
    realVsizeCredentials: Awaited<ReturnType<typeof credentials.getRealCredentials>>;
    /** Set once the coordinator has answered with real credentials, which it does once. */
    confirmed: boolean;
    outputs: { address: string; amount: number }[];
}

const getStatus = () => coordinator.getStatus(requestOptions);

const findRound = async () => {
    for (let attempt = 0; attempt < 60; attempt++) {
        const status = await getStatus();
        const round = status.RoundStates.find(
            r =>
                r.Phase === RoundPhase.InputRegistration &&
                r.BlameOf === `${'0'.repeat(64)}` &&
                getRoundParameters(r),
        );
        if (round) {
            const parameters = getRoundParameters(round) as CoinjoinRoundParameters;
            // Registering late means the round may change phase mid-registration.
            const remaining = new Date(round.InputRegistrationEnd).getTime() - Date.now();
            if (remaining > 30_000) return { round, parameters };
            log(`Round ${round.Id.slice(0, 16)} ends in ${remaining}ms, waiting for the next one`);
        }
        await delay(5000);
    }

    throw new Error('No round in input registration');
};

const getRound = async (roundId: string) => {
    const status = await getStatus();

    return status.RoundStates.find(r => r.Id === roundId);
};

const registerInput = async (
    round: Round,
    parameters: CoinjoinRoundParameters,
    wallet: Wallet,
    utxo: Utxo,
): Promise<Alice> => {
    const outpoint = getOutpoint(utxo);
    const commitmentData = Buffer.from(getCommitmentData(COORDINATOR_NAME, round.Id), 'hex');
    const ownershipProof = getOwnershipProof(wallet, commitmentData);

    const zeroAmountCredentials = credentials.getZeroCredentials(
        round.AmountCredentialIssuerParameters,
        parameters.MaxAmountCredentialValue,
    );
    const zeroVsizeCredentials = credentials.getZeroCredentials(
        round.VsizeCredentialIssuerParameters,
        parameters.MaxVsizeAllocationPerAlice,
    );

    const registrationData = await coordinator.inputRegistration(
        round.Id,
        outpoint,
        ownershipProof,
        zeroAmountCredentials,
        zeroVsizeCredentials,
        requestOptions,
    );
    log(`input-registration ${utxo.txid.slice(0, 16)}:${utxo.vout} accepted`);

    // The issued zero credentials are verified against the transcript the request was
    // built with: `getCredentials` throws if an issuer-parameters proof does not hold.
    const amountCredentials = credentials.getCredentials(
        round.AmountCredentialIssuerParameters,
        parameters.MaxAmountCredentialValue,
        registrationData.AmountCredentials,
        zeroAmountCredentials.CredentialsResponseValidation,
    );
    const vsizeCredentials = credentials.getCredentials(
        round.VsizeCredentialIssuerParameters,
        parameters.MaxVsizeAllocationPerAlice,
        registrationData.VsizeCredentials,
        zeroVsizeCredentials.CredentialsResponseValidation,
    );
    log('  issued zero credentials verified by the port');

    // Same arithmetic as `round/inputRegistration.ts`.
    const inputSize = getInputSize(SCRIPT_TYPE);
    const coordinatorFee =
        utxo.value > parameters.CoordinationFeeRate.PlebsDontPayThreshold &&
        !registrationData.IsPayingZeroCoordinationFee
            ? Math.floor(parameters.CoordinationFeeRate.Rate * utxo.value)
            : 0;
    const miningFee = Math.floor((inputSize * parameters.MiningFeeRate) / 1000);
    const amount = utxo.value - coordinatorFee - miningFee;
    const vsize = parameters.MaxVsizeAllocationPerAlice - inputSize;

    const realAmountCredentials = await credentials.getRealCredentials(
        [amount, 0],
        amountCredentials,
        round.AmountCredentialIssuerParameters,
        parameters.MaxAmountCredentialValue,
    );
    const realVsizeCredentials = await credentials.getRealCredentials(
        [vsize, 0],
        vsizeCredentials,
        round.VsizeCredentialIssuerParameters,
        parameters.MaxVsizeAllocationPerAlice,
    );

    return {
        wallet,
        utxo,
        outpoint,
        aliceId: registrationData.AliceId,
        amount,
        amountCredentials,
        vsizeCredentials,
        realAmountCredentials,
        realVsizeCredentials,
        confirmed: false,
        outputs: [],
    };
};

const confirmInput = async (round: Round, parameters: CoinjoinRoundParameters, alice: Alice) => {
    // A connection is confirmed once: confirming twice is `AliceAlreadyConfirmedConnection`,
    // and the real credentials have been consumed by then anyway.
    if (alice.confirmed) return true;

    const zeroAmountCredentials = credentials.getZeroCredentials(
        round.AmountCredentialIssuerParameters,
        parameters.MaxAmountCredentialValue,
    );
    const zeroVsizeCredentials = credentials.getZeroCredentials(
        round.VsizeCredentialIssuerParameters,
        parameters.MaxVsizeAllocationPerAlice,
    );

    const confirmationData = await coordinator.connectionConfirmation(
        round.Id,
        alice.aliceId,
        alice.realAmountCredentials,
        alice.realVsizeCredentials,
        zeroAmountCredentials,
        zeroVsizeCredentials,
        requestOptions,
    );

    // In input registration the coordinator answers with zero credentials only; the real
    // ones arrive once the round is in connection confirmation.
    if (!confirmationData.RealAmountCredentials || !confirmationData.RealVsizeCredentials) {
        return false;
    }

    alice.amountCredentials = credentials.getCredentials(
        round.AmountCredentialIssuerParameters,
        parameters.MaxAmountCredentialValue,
        confirmationData.RealAmountCredentials,
        alice.realAmountCredentials.CredentialsResponseValidation,
    );
    alice.vsizeCredentials = credentials.getCredentials(
        round.VsizeCredentialIssuerParameters,
        parameters.MaxVsizeAllocationPerAlice,
        confirmationData.RealVsizeCredentials,
        alice.realVsizeCredentials.CredentialsResponseValidation,
    );
    alice.confirmed = true;
    log(
        `connection-confirmation ${alice.aliceId.slice(0, 8)} accepted, real credentials ` +
            `verified: [${alice.amountCredentials.map(c => c.value)}] ` +
            `[${alice.vsizeCredentials.map(c => c.value)}]`,
    );

    return true;
};

/** `round/outputDecomposition.ts`, for one account whose credentials cover each output. */
const registerOutputs = async (
    round: Round,
    parameters: CoinjoinRoundParameters,
    alice: Alice,
    externalAmounts: number[],
) => {
    const inputSize = getInputSize(SCRIPT_TYPE);
    const outputSize = getOutputSize(SCRIPT_TYPE);
    const [amountCredential, zeroAmountCredential] = alice.amountCredentials;
    const [vsizeCredential, zeroVsizeCredential] = alice.vsizeCredentials;
    if (!amountCredential || !zeroAmountCredential || !vsizeCredential || !zeroVsizeCredential) {
        throw new Error('Confirmed credentials are not a pair');
    }

    const outputAmounts = getOutputAmounts(
        {
            InputSize: inputSize,
            OutputSize: outputSize,
            AvailableVsize: vsizeCredential.value,
            MiningFeeRate: parameters.MiningFeeRate,
            AllowedOutputAmounts: parameters.AllowedOutputAmounts,
            InternalAmounts: [alice.amount],
            ExternalAmounts: externalAmounts,
        },
        secureRandom,
    );
    const outputMiningFee = Math.floor((outputSize * parameters.MiningFeeRate) / 1000);
    log(`decomposed ${alice.amount} into ${outputAmounts.join(',')}`);

    let amountPair: [Credential, Credential] = [amountCredential, zeroAmountCredential];
    let vsizePair: [Credential, Credential] = [vsizeCredential, zeroVsizeCredential];

    for (const outputAmount of outputAmounts) {
        const amountToRequest = outputAmount + outputMiningFee;
        const availableAmount = amountPair[0].value + amountPair[1].value;
        const availableVsize = vsizePair[0].value + vsizePair[1].value;
        if (amountToRequest > availableAmount || outputSize > availableVsize) {
            throw new Error(`Credentials do not cover an output of ${amountToRequest}`);
        }

        // Split the pair into what the output needs and what is left over, which pays for
        // the next output.
        const issuanceAmountCredentials = await credentials.getRealCredentials(
            [amountToRequest, availableAmount - amountToRequest],
            amountPair,
            round.AmountCredentialIssuerParameters,
            parameters.MaxAmountCredentialValue,
        );
        const issuanceVsizeCredentials = await credentials.getRealCredentials(
            [outputSize, availableVsize - outputSize],
            vsizePair,
            round.VsizeCredentialIssuerParameters,
            parameters.MaxVsizeAllocationPerAlice,
        );
        const zeroAmountCredentials = credentials.getZeroCredentials(
            round.AmountCredentialIssuerParameters,
            parameters.MaxAmountCredentialValue,
        );
        const zeroVsizeCredentials = credentials.getZeroCredentials(
            round.VsizeCredentialIssuerParameters,
            parameters.MaxVsizeAllocationPerAlice,
        );

        const issuanceData = await coordinator.credentialIssuance(
            round.Id,
            issuanceAmountCredentials,
            issuanceVsizeCredentials,
            zeroAmountCredentials,
            zeroVsizeCredentials,
            requestOptions,
        );

        const issuedAmount = credentials.getCredentials(
            round.AmountCredentialIssuerParameters,
            parameters.MaxAmountCredentialValue,
            issuanceData.RealAmountCredentials,
            issuanceAmountCredentials.CredentialsResponseValidation,
        );
        const issuedVsize = credentials.getCredentials(
            round.VsizeCredentialIssuerParameters,
            parameters.MaxVsizeAllocationPerAlice,
            issuanceData.RealVsizeCredentials,
            issuanceVsizeCredentials.CredentialsResponseValidation,
        );
        const issuedZeroAmount = credentials.getCredentials(
            round.AmountCredentialIssuerParameters,
            parameters.MaxAmountCredentialValue,
            issuanceData.ZeroAmountCredentials,
            zeroAmountCredentials.CredentialsResponseValidation,
        );
        const issuedZeroVsize = credentials.getCredentials(
            round.VsizeCredentialIssuerParameters,
            parameters.MaxVsizeAllocationPerAlice,
            issuanceData.ZeroVsizeCredentials,
            zeroVsizeCredentials.CredentialsResponseValidation,
        );
        const [outputAmountCredential, changeAmountCredential] = issuedAmount;
        const [outputVsizeCredential, changeVsizeCredential] = issuedVsize;
        const [outputZeroAmount, changeZeroAmount] = issuedZeroAmount;
        const [outputZeroVsize, changeZeroVsize] = issuedZeroVsize;
        if (
            !outputAmountCredential ||
            !changeAmountCredential ||
            !outputVsizeCredential ||
            !changeVsizeCredential ||
            !outputZeroAmount ||
            !changeZeroAmount ||
            !outputZeroVsize ||
            !changeZeroVsize
        ) {
            throw new Error('credential-issuance returned an incomplete pair');
        }
        log(
            `credential-issuance accepted, reissued credentials verified: ` +
                `[${outputAmountCredential.value},${changeAmountCredential.value}] ` +
                `[${outputVsizeCredential.value},${changeVsizeCredential.value}]`,
        );

        // The output registration presents credentials without asking for new ones.
        const outputAmountCredentials = await credentials.getRealCredentials(
            [],
            [outputAmountCredential, outputZeroAmount],
            round.AmountCredentialIssuerParameters,
            parameters.MaxAmountCredentialValue,
        );
        const outputVsizeCredentials = await credentials.getRealCredentials(
            [],
            [outputVsizeCredential, outputZeroVsize],
            round.VsizeCredentialIssuerParameters,
            parameters.MaxVsizeAllocationPerAlice,
        );

        const output = createWallet();
        await coordinator.outputRegistration(
            round.Id,
            { scriptPubKey: getScriptPubKeyFromAddress(output.address, NETWORK, SCRIPT_TYPE) },
            outputAmountCredentials,
            outputVsizeCredentials,
            requestOptions,
        );
        log(`output-registration ${output.address} for ${outputAmount} accepted`);
        alice.outputs.push({ address: output.address, amount: outputAmount });

        amountPair = [changeAmountCredential, changeZeroAmount];
        vsizePair = [changeVsizeCredential, changeZeroVsize];
    }

    await coordinator.readyToSign(round.Id, alice.aliceId, requestOptions);
    log(`ready-to-sign ${alice.aliceId.slice(0, 8)} accepted`);
};

/** `round/transactionSigning.ts`: the coordinator's transaction, signed input by input. */
const signTransaction = async (round: Round, alices: Alice[]) => {
    const registeredInputs = getRoundEvents('InputAdded', round.CoinjoinState.Events);
    const registeredOutputs = mergePubkeys(
        getRoundEvents('OutputAdded', round.CoinjoinState.Events),
    );

    const inputs: TxInput[] = registeredInputs
        .sort((a, b) => sortInputs(a.Coin, b.Coin))
        .map(({ Coin }) => {
            const { txid } = readOutpoint(Coin.Outpoint);

            return {
                hash: Buffer.from(txid, 'hex'),
                index: readOutpoint(Coin.Outpoint).index,
                value: Coin.TxOut.Value,
                scriptPubKey: prefixScriptPubKey(Coin.TxOut.ScriptPubKey, false),
            };
        });
    const outputs: TxOutput[] = registeredOutputs
        .sort((a, b) => sortOutputs(a.Output, b.Output))
        .map(({ Output }) => ({
            value: Output.Value,
            scriptPubKey: prefixScriptPubKey(Output.ScriptPubKey, false),
        }));

    log(
        `the coordinator built ${inputs.length} inputs and ${outputs.length} outputs: ` +
            outputs.map(output => output.value).join(','),
    );

    for (const alice of alices) {
        const inputIndex = inputs.findIndex(
            input =>
                `${input.hash.toString('hex')}${uint32(input.index).toString('hex')}` ===
                alice.outpoint,
        );
        if (inputIndex < 0) throw new Error(`Input ${alice.outpoint} is not in the transaction`);

        const signature = sign(alice.wallet, taprootSignatureHash(inputs, outputs, inputIndex));
        await coordinator.transactionSignature(
            round.Id,
            inputIndex,
            getWitnessFromSignature(signature.toString('hex')),
            requestOptions,
        );
        log(`transaction-signature for input ${inputIndex} accepted`);
    }

    return serializeTransaction(inputs, outputs);
};

const waitForPhase = async (roundId: string, phase: RoundPhase, onWait?: () => Promise<void>) => {
    for (let attempt = 0; attempt < 240; attempt++) {
        const round = await getRound(roundId);
        if (!round) throw new Error(`Round ${roundId} disappeared before phase ${phase}`);
        if (round.EndRoundState !== EndRoundState.None) {
            throw new Error(`Round ended with state ${round.EndRoundState}`);
        }
        if (round.Phase >= phase) return round;
        if (onWait) await onWait();
        await delay(5000);
    }

    throw new Error(`Round ${roundId} never reached phase ${phase}`);
};

(async () => {
    log(`coordinator ${COORDINATOR_URL}`);

    const wallets = Array.from({ length: INPUT_COUNT }, createWallet);
    await Promise.all(wallets.map(wallet => fundAddress(wallet.address)));
    await generateBlock();
    const utxos = await Promise.all(wallets.map(wallet => waitForUtxo(wallet.address)));
    wallets.forEach((wallet, index) =>
        log(`input ${index}: ${utxos[index]?.value} on ${wallet.address}`),
    );

    const { round, parameters } = await findRound();
    log(
        `round ${round.Id} ${parameters.Network}, mining fee rate ${parameters.MiningFeeRate}, ` +
            `coordination fee ${parameters.CoordinationFeeRate.Rate}`,
    );

    const alices: Alice[] = [];
    for (let index = 0; index < wallets.length; index++) {
        const wallet = wallets[index];
        const utxo = utxos[index];
        if (!wallet || !utxo) throw new Error('Missing wallet or utxo');
        alices.push(await registerInput(round, parameters, wallet, utxo));
    }

    // Input registration lasts until its timeout even once the round is full, and an Alice
    // that stops pinging is removed, so keep confirming while waiting for phase 1.
    const confirmed = await waitForPhase(round.Id, RoundPhase.ConnectionConfirmation, async () => {
        for (const alice of alices) {
            await confirmInput(round, parameters, alice);
        }
        log('confirmation pings accepted in input registration');
    });
    log(`round reached phase ${confirmed.Phase} (connection confirmation)`);

    for (const alice of alices) {
        const isConfirmed = await confirmInput(confirmed, parameters, alice);
        if (!isConfirmed) throw new Error('No real credentials in connection confirmation');
    }

    const registering = await waitForPhase(round.Id, RoundPhase.OutputRegistration);
    log(`round reached phase ${registering.Phase} (output registration)`);

    for (const alice of alices) {
        const externalAmounts = alices.filter(a => a !== alice).map(a => a.amount);
        await registerOutputs(registering, parameters, alice, externalAmounts);
    }

    const signing = await waitForPhase(round.Id, RoundPhase.TransactionSigning);
    log(`round reached phase ${signing.Phase} (transaction signing)`);

    const transaction = await signTransaction(signing, alices);
    const txid = Buffer.from(hash256(transaction)).reverse().toString('hex');

    for (let attempt = 0; attempt < 60; attempt++) {
        const ended = await getRound(round.Id);
        if (ended && ended.EndRoundState !== EndRoundState.None) {
            log(`round end state ${ended.EndRoundState} (${EndRoundState[ended.EndRoundState]})`);
            if (ended.EndRoundState !== EndRoundState.TransactionBroadcasted) {
                throw new Error(`Round did not broadcast: ${EndRoundState[ended.EndRoundState]}`);
            }
            break;
        }
        if (!ended) break; // the round left the status before it could be read
        await delay(2000);
    }

    await generateBlock();
    const broadcast: any = await getBroadcastTransaction(txid);
    log(`BROADCAST coinjoin transaction ${txid}`);
    log(
        `  ${broadcast.confirmations} confirmation(s) in block ${broadcast.blockHeight}, ` +
            `fee ${broadcast.fees}`,
    );
    broadcast.vout.forEach((output: any) => {
        const mine = alices.some(alice =>
            alice.outputs.some(o => output.addresses?.includes(o.address)),
        );
        log(`  output ${output.addresses?.[0]} ${output.value}${mine ? ' (ours)' : ''}`);
    });
})().catch(error => {
    console.error(error);
    process.exit(1);
});
