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
    isTestnet?: boolean;
};

const createTransactionBuilder = ({
    descriptor,
    sequence,
    fee,
    isTestnet = false,
}: CreateTransactionBuilderParams) => {
    const source = new Account(descriptor, sequence);

    return new TransactionBuilder(source, {
        fee,
        networkPassphrase: isTestnet ? Networks.TESTNET : Networks.PUBLIC,
    }).setTimebounds(0, 0);
};

type BuildSendTransactionParams = CreateTransactionBuilderParams & {
    destinationActivated: boolean;
    destination: string;
    amount: string;
    asset: StellarAsset;
    destinationTag?: string;
};

export const buildSendTransaction = ({
    descriptor,
    sequence,
    fee,
    destinationActivated,
    destination,
    amount,
    asset,
    destinationTag,
    isTestnet,
}: BuildSendTransactionParams) => {
    const txBuilder = createTransactionBuilder({ descriptor, sequence, fee, isTestnet });

    if (destinationTag) {
        txBuilder.addMemo(Memo.text(destinationTag));
    }

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
    isTestnet,
}: BuildTrustlineTransactionParams) => {
    const txBuilder = createTransactionBuilder({ descriptor, sequence, fee, isTestnet });

    txBuilder.addOperation(
        Operation.changeTrust({
            asset: new Asset(asset.code!, asset.issuer),
            limit, // If limit is '0', it removes the trustline
        }),
    );

    return txBuilder.build();
};

type BuildTrustlineParams = Omit<BuildTrustlineTransactionParams, 'limit'>;

export const buildAddTrustlineTransaction = ({
    descriptor,
    sequence,
    fee,
    asset,
    isTestnet,
}: BuildTrustlineParams) =>
    buildTrustlineTransaction({ descriptor, sequence, fee, asset, isTestnet });

export const buildRemoveTrustlineTransaction = ({
    descriptor,
    sequence,
    fee,
    asset,
    isTestnet,
}: BuildTrustlineParams) =>
    buildTrustlineTransaction({ descriptor, sequence, fee, asset, limit: '0', isTestnet });

type BuildContractTokenTransferParams = CreateTransactionBuilderParams & {
    /** The `C…` id of the SEP-41 token being sent. */
    contract: string;
    destination: string;
    /** In the token's own base units, already scaled by its `decimals`. */
    amount: string;
};

/**
 * A SEP-41 `transfer(from, to, amount)` call, necessarily the sole operation of the transaction —
 * Stellar does not let a host function share one. The sender is the transaction source, so the
 * operation needs no authorization entries of its own.
 *
 * The result is **not yet submittable**: pass it through `prepareContractTransaction`, which adds
 * the ledger footprint and resource fee only a simulation can determine.
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
