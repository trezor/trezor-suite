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
    destinationTag?: string;
    isTestnet?: boolean;
};

const createTransactionBuilder = ({
    descriptor,
    sequence,
    fee,
    destinationTag,
    isTestnet = false,
}: CreateTransactionBuilderParams) => {
    const source = new Account(descriptor, sequence);

    const txBuilder = new TransactionBuilder(source, {
        fee,
        networkPassphrase: isTestnet ? Networks.TESTNET : Networks.PUBLIC,
    }).setTimebounds(0, 0);

    if (destinationTag) {
        txBuilder.addMemo(Memo.text(destinationTag));
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
    destinationTag,
    isTestnet,
}: BuildSendTransactionParams) => {
    const txBuilder = createTransactionBuilder({
        descriptor,
        sequence,
        fee,
        destinationTag,
        isTestnet,
    });

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
    destinationTag,
    isTestnet,
}: BuildTrustlineTransactionParams) => {
    const txBuilder = createTransactionBuilder({
        descriptor,
        sequence,
        fee,
        destinationTag,
        isTestnet,
    });

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

export type BuildContractTokenTransferParams = CreateTransactionBuilderParams & {
    /** The `C…` id of the SEP-41 token being sent. */
    contract: string;
    destination: string;
    /** In the token's own base units, already scaled by its `decimals`. */
    amount: string;
};

/**
 * A SEP-41 `transfer(from, to, amount)`, necessarily the sole operation. Not yet submittable:
 * `prepareContractTransaction` adds the footprint and resource fee only a simulation can determine.
 */
export const buildContractTokenTransferTransaction = ({
    descriptor,
    sequence,
    fee,
    contract,
    destination,
    amount,
    destinationTag,
    isTestnet,
}: BuildContractTokenTransferParams) => {
    const txBuilder = createTransactionBuilder({
        descriptor,
        sequence,
        fee,
        destinationTag,
        isTestnet,
    });

    txBuilder.addOperation(
        new Contract(contract).call(
            'transfer',
            Address.fromString(descriptor).toScVal(),
            Address.fromString(destination).toScVal(),
            // SEP-41 amounts are i128; an 18-decimal token overflows a double long before that.
            nativeToScVal(BigInt(amount), { type: 'i128' }),
        ),
    );

    return txBuilder.build();
};
