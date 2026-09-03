import { Asset, Keypair, xdr } from '@stellar/stellar-sdk';

const toAccountId = (descriptor: string) => Keypair.fromPublicKey(descriptor).xdrAccountId();

export const buildAccountKey = (descriptor: string): xdr.LedgerKey =>
    xdr.LedgerKey.account(new xdr.LedgerKeyAccount({ accountId: toAccountId(descriptor) }));

export const buildTrustlineKey = (
    descriptor: string,
    assetCode: string,
    assetIssuer: string,
): xdr.LedgerKey =>
    xdr.LedgerKey.trustline(
        new xdr.LedgerKeyTrustLine({
            accountId: toAccountId(descriptor),
            asset: new Asset(assetCode, assetIssuer).toTrustLineXDRObject(),
        }),
    );
