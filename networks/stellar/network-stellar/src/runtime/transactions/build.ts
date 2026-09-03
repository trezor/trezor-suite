import {
    Account,
    Asset,
    Memo,
    Networks,
    Operation,
    TransactionBuilder,
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
