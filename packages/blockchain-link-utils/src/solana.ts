import { A, D, F, pipe } from '@mobily/ts-belt';
import BigNumber from 'bignumber.js';

import { Target, Transaction } from '@trezor/blockchain-link-types/lib';
import type {
    AccountInfo,
    ParsedAccountData,
    ParsedInstruction,
    ParsedTransactionWithMeta,
    PublicKey,
    SolanaValidParsedTxWithMeta,
    TokenDetailByMint,
} from '@trezor/blockchain-link-types/lib/solana';
import type { TokenInfo } from '@trezor/blockchain-link-types/lib';

export type ApiTokenAccount = { account: AccountInfo<ParsedAccountData>; pubkey: PublicKey };

export const TOKEN_PROGRAM_PUBLIC_KEY = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const ASSOCIATED_TOKEN_PROGRAM_PUBLIC_KEY = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
export const SYSTEM_PROGRAM_PUBLIC_KEY = '11111111111111111111111111111111';

export const getTokenNameAndSymbol = (mint: string, tokenDetailByMint: TokenDetailByMint) => {
    const tokenDetail = tokenDetailByMint[mint];

    return tokenDetail
        ? { name: tokenDetail.name, symbol: tokenDetail.symbol }
        : {
              name: mint,
              symbol: `${mint.slice(0, 3)}...`,
          };
};

export const transformTokenInfo = (
    tokenAccounts: ApiTokenAccount[],
    tokenDetailByMint: TokenDetailByMint,
) => {
    const tokens: TokenInfo[] = F.toMutable(
        pipe(
            tokenAccounts,
            A.map((tokenAccount: ApiTokenAccount): TokenInfo & { address: string } => {
                const { info } = tokenAccount.account.data.parsed;

                return {
                    type: 'SPL', // Designation for Solana tokens
                    contract: info.mint,
                    balance: info.tokenAmount.amount,
                    decimals: info.tokenAmount.decimals,
                    ...getTokenNameAndSymbol(info.mint, tokenDetailByMint),
                    address: tokenAccount.pubkey.toString(),
                };
            }),
            A.reduce(
                {},
                (acc: { [mint: string]: TokenInfo }, token: TokenInfo & { address: string }) => {
                    if (acc[token.contract] != null) {
                        acc[token.contract].balance = new BigNumber(
                            acc[token.contract].balance || '0',
                        )
                            .plus(token.balance || '0')
                            .toString();
                        acc[token.contract].accounts!.push({
                            publicKey: token.address,
                            balance: token.balance || '0',
                        });
                    } else {
                        const { type, contract, balance, decimals, name, symbol } = token;
                        acc[token.contract] = {
                            type,
                            contract,
                            balance,
                            decimals,
                            name,
                            symbol,
                            accounts: [{ publicKey: token.address, balance: balance || '0' }],
                        };
                    }

                    return acc;
                },
            ),
            D.values,
        ),
    );

    return tokens;
};

// First step in parsing a tx, is getting Solana effects on accounts that were in the transaction, from this effects we later parse the other tx properties.
export const extractAccountBalanceDiff = (
    transaction: ParsedTransactionWithMeta,
    address: string,
): {
    preBalance: BigNumber;
    postBalance: BigNumber;
} | null => {
    const pubKeyIndex = transaction.transaction.message.accountKeys.findIndex(
        ak => ak.pubkey.toString() === address,
    );

    if (pubKeyIndex === -1) {
        return null;
    }

    return {
        preBalance: new BigNumber(transaction.meta?.preBalances[pubKeyIndex] ?? 0),
        postBalance: new BigNumber(transaction.meta?.postBalances[pubKeyIndex] ?? 0),
    };
};

type TransactionEffect = {
    address: string;
    amount: BigNumber;
};

export const getTransactionEffects = (
    transaction: ParsedTransactionWithMeta,
): TransactionEffect[] =>
    transaction.transaction.message.accountKeys
        .map(ak => {
            const targetAddress = ak.pubkey.toString();
            const balanceDiff = extractAccountBalanceDiff(transaction, targetAddress);
            if (!balanceDiff) {
                return null;
            }

            return {
                address: targetAddress,
                amount: balanceDiff.postBalance.minus(balanceDiff.preBalance),
            };
        })
        .filter((effect): effect is TransactionEffect => !!effect)
        .filter(({ amount }) => !amount.isZero()); // filter out zero effects

export const getTargets = (
    effects: TransactionEffect[],
    txType: Transaction['type'],
    accountAddress: string,
): Transaction['targets'] =>
    effects
        .filter(effect => {
            // for 'self` transaction there is only one effect
            if (txType === 'self') {
                return true;
            }
            // ignore all targets for unknown transactions
            if (txType === 'unknown') {
                return false;
            }
            // count in only positive effects, for `sent` tx they gonna be represented as negative, for `recv` as positive
            return effect.amount.isGreaterThan(0);
        })
        .map((effect, i) => {
            const target: Target = {
                n: i,
                addresses: [effect.address],
                isAddress: true,
                amount: effect.amount.abs().toString(),
                isAccountTarget: effect.address === accountAddress && txType !== 'sent',
            };
            return target;
        });

export const getTxType = (
    transaction: ParsedTransactionWithMeta,
    effects: TransactionEffect[],
    accountAddress: string,
): Transaction['type'] => {
    if (transaction.meta?.err) {
        return 'failed';
    }

    // we consider only parsed instructions because only based on them we can determine the type of transaction
    const parsedInstructions = transaction.transaction.message.instructions.filter(
        (instruction): instruction is ParsedInstruction => 'parsed' in instruction,
    );

    if (parsedInstructions.length === 0) {
        return 'unknown';
    }

    const isTransfer = parsedInstructions.every(
        instruction => instruction.parsed.type === 'transfer',
    );

    // for now we support only transfers, so we interpret all other transactions as `unknown`
    if (isTransfer) {
        if (
            effects.length === 1 &&
            effects[0]?.address === accountAddress &&
            effects[0]?.amount.abs().isEqualTo(new BigNumber(transaction.meta?.fee || 0))
        ) {
            return 'self';
        }

        const senders = effects.filter(({ amount }) => amount.isNegative());

        if (senders.find(({ address }) => address === accountAddress)) {
            return 'sent';
        }

        const receivers = effects.filter(({ amount }) => amount.isPositive());

        if (receivers.find(({ address }) => address === accountAddress)) {
            return 'recv';
        }
    }

    // TODO(vl): phase two, isTokenTx

    return 'unknown';
};

export const getDetails = (
    transaction: ParsedTransactionWithMeta,
    effects: TransactionEffect[],
    accountAddress: string,
): Transaction['details'] => {
    const senders = effects.filter(({ amount }) => amount.isNegative());
    const receivers = effects.filter(({ amount }) => amount.isPositive());

    const getVin = (effect: TransactionEffect, i: number) => ({
        txid: transaction.transaction.signatures[0].toString(),
        version: transaction.version,
        isAddress: true,
        isAccountOwned: effect.address === accountAddress,
        n: i,
        value: effect.amount.abs().toString(),
        addresses: [effect.address],
    });
    return {
        size: transaction.meta?.computeUnitsConsumed || 0,
        totalInput: senders
            .reduce((acc, curr) => acc.plus(curr.amount.abs()), new BigNumber(0))
            .toString(),
        totalOutput: receivers
            .reduce((acc, curr) => acc.plus(curr.amount.abs()), new BigNumber(0))
            .toString(),
        vin: senders.map((sender, i) => getVin(sender, i)),
        vout: receivers.map((receiver, i) => getVin(receiver, i)),
    };
};

export const getAmount = (
    accountEffect: TransactionEffect | undefined,
    txType: Transaction['type'],
): string => {
    if (!accountEffect) {
        return '0';
    }
    if (txType === 'self') {
        return accountEffect.amount?.abs().toString();
    }
    return accountEffect.amount.toString();
};

export const transformTransaction = (
    tx: SolanaValidParsedTxWithMeta,
    accountAddress: string,
    slotToBlockHeightMapping: Record<number, number | null>,
): Transaction => {
    const effects = getTransactionEffects(tx);

    const type = getTxType(tx, effects, accountAddress);

    const targets = getTargets(effects, type, accountAddress);

    const amount = getAmount(
        effects.find(({ address }) => address === accountAddress),
        type,
    );

    return {
        type,
        txid: tx.transaction.signatures[0].toString(),
        blockTime: tx.blockTime,
        amount,
        fee: tx.meta.fee.toString(),
        targets,
        tokens: [], // TODO(vl): phase 2
        internalTransfers: [], // not relevant for solana
        details: getDetails(tx, effects, accountAddress),
        blockHeight: slotToBlockHeightMapping[tx.slot] || undefined,
        blockHash: tx.transaction.message.recentBlockhash,
    };
};
