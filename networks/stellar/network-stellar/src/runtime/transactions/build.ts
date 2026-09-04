import {
    Account,
    Address,
    Asset,
    Contract,
    Memo,
    Networks,
    Operation,
    TransactionBuilder,
    nativeToScVal,
} from '@stellar/stellar-sdk';

type StellarAsset = {
    type: 0 | 1 | 2 | 'NATIVE' | 'ALPHANUM4' | 'ALPHANUM12';
    code?: string;
    issuer?: string;
};

type CreateTransactionBuilderParams = {
    descriptor: string;
    sequence: string;
    fee: string;
    memo?: string;
    isTestnet?: boolean;
};

const createTransactionBuilder = ({
    descriptor,
    sequence,
    fee,
    memo,
    isTestnet = false,
}: CreateTransactionBuilderParams) => {
    const source = new Account(descriptor, sequence);

    const txBuilder = new TransactionBuilder(source, {
        fee,
        networkPassphrase: isTestnet ? Networks.TESTNET : Networks.PUBLIC,
    }).setTimebounds(0, 0);

    if (memo) {
        txBuilder.addMemo(Memo.text(memo));
    }

    return txBuilder;
};

type BuildSendTransactionParams = CreateTransactionBuilderParams & {
    destinationActivated: boolean;
    destination: string;
    amount: string;
    asset: StellarAsset;
};

export const buildSendTransaction = ({
    descriptor,
    sequence,
    fee,
    destinationActivated,
    destination,
    amount,
    asset,
    memo,
    isTestnet,
}: BuildSendTransactionParams) => {
    const txBuilder = createTransactionBuilder({ descriptor, sequence, fee, memo, isTestnet });

    if (destinationActivated) {
        txBuilder.addOperation(
            Operation.payment({
                destination,
                amount,
                asset: new Asset(asset.code || 'XLM', asset.issuer),
            }),
        );
    } else {
        txBuilder.addOperation(
            Operation.createAccount({
                destination,
                startingBalance: amount,
            }),
        );
    }

    return txBuilder.build();
};

type BuildTrustlineTransactionParams = CreateTransactionBuilderParams & {
    asset: StellarAsset;
    limit?: string;
};

const buildTrustlineTransaction = ({
    descriptor,
    sequence,
    fee,
    asset,
    limit,
    memo,
    isTestnet,
}: BuildTrustlineTransactionParams) => {
    const txBuilder = createTransactionBuilder({ descriptor, sequence, fee, memo, isTestnet });

    txBuilder.addOperation(
        Operation.changeTrust({
            asset: new Asset(asset.code!, asset.issuer),
            limit, // If limit is '0', it removes the trustline
        }),
    );

    return txBuilder.build();
};

type BuildTrustlineParams = Omit<BuildTrustlineTransactionParams, 'limit'>;

export const buildAddTrustlineTransaction = (params: BuildTrustlineParams) =>
    buildTrustlineTransaction(params);

export const buildRemoveTrustlineTransaction = (params: BuildTrustlineParams) =>
    buildTrustlineTransaction({ ...params, limit: '0' });

type BuildContractTokenTransferParams = CreateTransactionBuilderParams & {
    /** The `C…` id of the SEP-41 token being sent. */
    contract: string;
    destination: string;
    /** In the token's own base units, already scaled by its `decimals`. */
    amount: string;
};

/**
 * A SEP-41 `transfer(from, to, amount)` call, as the sole operation of a transaction.
 *
 * The sender is the transaction source, so the contract's authorization is covered by the
 * source account and the operation needs no authorization entries of its own. Stellar does not
 * allow a host function to share a transaction with other operations, and `@trezor/connect`
 * rejects one that tries.
 *
 * The transaction this returns is **not yet submittable**: a Soroban transaction also needs the
 * ledger footprint and resource fee that only a simulation can determine. Pass it through
 * `prepareContractTransaction` before signing.
 */
export const buildContractTokenTransferTransaction = ({
    descriptor,
    sequence,
    fee,
    contract,
    destination,
    amount,
    isTestnet,
}: BuildContractTokenTransferParams) => {
    const txBuilder = createTransactionBuilder({ descriptor, sequence, fee, isTestnet });

    txBuilder.addOperation(
        new Contract(contract).call(
            'transfer',
            Address.fromString(descriptor).toScVal(),
            Address.fromString(destination).toScVal(),
            // SEP-41 types the amount as an i128, and a token with 18 decimals overflows a
            // double long before it overflows that, so it is carried as a bigint throughout.
            nativeToScVal(BigInt(amount), { type: 'i128' }),
        ),
    );

    return txBuilder.build();
};
