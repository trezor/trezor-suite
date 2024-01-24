import { A, D, F, pipe } from '@mobily/ts-belt';
import BigNumber from 'bignumber.js';

import { Target, TokenTransfer, Transaction } from '@trezor/blockchain-link-types/lib';
import { arrayPartition } from '@trezor/utils';
import type {
    AccountInfo,
    ParsedAccountData,
    ParsedInstruction,
    ParsedTransactionWithMeta,
    SolanaValidParsedTxWithMeta,
    SolanaTokenAccountInfo,
    PartiallyDecodedInstruction,
    TokenDetailByMint,
    PublicKey,
} from '@trezor/blockchain-link-types/lib/solana';
import type { TokenInfo } from '@trezor/blockchain-link-types/lib';

export type ApiTokenAccount = { account: AccountInfo<ParsedAccountData>; pubkey: PublicKey };

// Docs regarding solana programs: https://spl.solana.com/
// Token program docs: https://spl.solana.com/token
export const TOKEN_PROGRAM_PUBLIC_KEY = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
// Associated token program docs: https://spl.solana.com/associated-token-account
export const ASSOCIATED_TOKEN_PROGRAM_PUBLIC_KEY = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
// System program docs: https://docs.solana.com/developing/runtime-facilities/programs#system-program
export const SYSTEM_PROGRAM_PUBLIC_KEY = '11111111111111111111111111111111';
// WSOL transfers are denoted as transfers of SOL as well as WSOL, so we use this to filter out SOL values
// when parsing tx effects.
export const WSOL_MINT = 'So11111111111111111111111111111111111111112';

export const getTokenNameAndSymbol = (mint: string, tokenDetailByMint: TokenDetailByMint) => {
    const tokenDetail = tokenDetailByMint[mint];

    return tokenDetail
        ? { name: tokenDetail.name, symbol: tokenDetail.symbol }
        : {
              name: mint,
              symbol: `${mint.slice(0, 3)}...`,
          };
};

type SplTokenAccountData = {
    /** Name of the program that owns this account */
    program: 'spl-token';
    /** Parsed account data */
    parsed: {
        info: {
            mint: string;
            tokenAmount: {
                amount: string;
                decimals: number;
            };
        };
    };
    /** Space used by account data */
    space: number;
};

type SplTokenAccount = { account: AccountInfo<SplTokenAccountData>; pubkey: PublicKey };

const isSplTokenAccount = (tokenAccount: ApiTokenAccount): tokenAccount is SplTokenAccount => {
    const { parsed } = tokenAccount.account.data;
    return (
        tokenAccount.account.data.program === 'spl-token' &&
        'info' in parsed &&
        'mint' in parsed.info &&
        typeof parsed.info.mint === 'string' &&
        'tokenAmount' in parsed.info &&
        typeof parsed.info.tokenAmount.amount === 'string' &&
        typeof parsed.info.tokenAmount.decimals === 'number'
    );
};

export const transformTokenInfo = (
    tokenAccounts: ApiTokenAccount[],
    tokenDetailByMint: TokenDetailByMint,
) => {
    const tokens: TokenInfo[] = F.toMutable(
        pipe(
            tokenAccounts,
            // since ApiTokenAccount type is not precise enough, we type-guard the account to make sure they contain all the necessary data
            A.filter(isSplTokenAccount),
            A.map(tokenAccount => {
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
    isTokenDiff = false,
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

    if (isTokenDiff) {
        const preBalance = transaction.meta?.preTokenBalances?.find(
            balance => balance.accountIndex === pubKeyIndex,
        )?.uiTokenAmount.amount;
        const postBalance = transaction.meta?.postTokenBalances?.find(
            balance => balance.accountIndex === pubKeyIndex,
        )?.uiTokenAmount.amount;

        return {
            preBalance: new BigNumber(preBalance ?? 0),
            postBalance: new BigNumber(postBalance ?? 0),
        };
    }

    const preBalance = transaction.meta?.preBalances[pubKeyIndex];

    const postBalance = transaction.meta?.postBalances[pubKeyIndex];

    return {
        preBalance: new BigNumber(preBalance ?? 0),
        postBalance: new BigNumber(postBalance ?? 0),
    };
};

const isWSolTransfer = (ixs: (ParsedInstruction | PartiallyDecodedInstruction)[]) =>
    ixs.find(ix => 'parsed' in ix && ix.parsed.info?.mint === WSOL_MINT);

type TransactionEffect = {
    address: string;
    amount: BigNumber;
};

export function getNativeEffects(transaction: ParsedTransactionWithMeta): TransactionEffect[] {
    const wSolTransferInstruction = isWSolTransfer(
        transaction.transaction.message.instructions || [],
    );

    return transaction.transaction.message.accountKeys
        .map(ak => {
            const targetAddress = ak.pubkey.toString();
            const balanceDiff = extractAccountBalanceDiff(transaction, targetAddress);

            // WSOL Transfers are counted as SOL transfers in the transaction effects, leading to duplicate
            // entries in the tx history. This serves to filter out the WSOL transfers from the native effects.
            if (wSolTransferInstruction && 'parsed' in wSolTransferInstruction) {
                if (
                    wSolTransferInstruction.parsed.info.destination === targetAddress ||
                    wSolTransferInstruction.parsed.info.source === targetAddress
                ) {
                    return null;
                }
            }

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
}

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

const getTokenTransferTxType = (transfers: TokenTransfer[]) => {
    if (transfers.some(({ type }) => type === 'recv')) {
        return 'recv';
    }

    if (transfers.some(({ type }) => type === 'sent')) {
        return 'sent';
    }

    return 'unknown';
};

const getNativeTransferTxType = (
    effects: TransactionEffect[],
    accountAddress: string,
    transaction: ParsedTransactionWithMeta,
) => {
    if (
        effects.length === 1 &&
        effects[0]?.address === accountAddress &&
        effects[0]?.amount.abs().isEqualTo(new BigNumber(transaction.meta?.fee || 0))
    ) {
        return 'self';
    }

    const [senders, receivers] = arrayPartition(effects, ({ amount }) => amount.isNegative());

    if (senders.some(({ address }) => address === accountAddress)) {
        return 'sent';
    }

    if (receivers.some(({ address }) => address === accountAddress)) {
        return 'recv';
    }

    return 'unknown';
};

export const getTxType = (
    transaction: ParsedTransactionWithMeta,
    effects: TransactionEffect[],
    accountAddress: string,
    tokenTransfers: TokenTransfer[],
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

    const isInstructionCreatingTokenAccount = (instruction: ParsedInstruction) =>
        instruction.program === 'spl-associated-token-account' &&
        (instruction.parsed.type === 'create' || instruction.parsed.type === 'createIdempotent');

    const isTransfer = parsedInstructions.every(
        instruction =>
            instruction.parsed.type === 'transfer' ||
            instruction.parsed.type === 'transferChecked' ||
            (instruction.program === 'system' && instruction.parsed.type === 'advanceNonce') ||
            isInstructionCreatingTokenAccount(instruction),
    );

    // for now we support only transfers, so we interpret all other transactions as `unknown`
    if (isTransfer) {
        return tokenTransfers.length > 0
            ? getTokenTransferTxType(tokenTransfers)
            : getNativeTransferTxType(effects, accountAddress, transaction);
    }

    return 'unknown';
};

export const getDetails = (
    transaction: ParsedTransactionWithMeta,
    effects: TransactionEffect[],
    accountAddress: string,
    txType: Transaction['type'],
): Transaction['details'] => {
    const senders = effects.filter(({ amount }) => amount.isNegative());
    const receivers = effects.filter(({ amount }) => amount.isPositive());

    const getVin = ({ address, amount }: { address: string; amount?: BigNumber }, i: number) => ({
        txid: transaction.transaction.signatures[0].toString(),
        version: transaction.version,
        isAddress: true,
        isAccountOwned: address === accountAddress,
        n: i,
        value: amount?.abs().toString(),
        addresses: [address],
    });

    const vin = senders.map((sender, i) => getVin(sender, i));
    const vout = receivers.map((receiver, i) => getVin(receiver, i));

    // we add add vout for `self` transactions to be consistent with other coins
    if (txType === 'self') {
        vout.push(getVin({ address: accountAddress }, vout.length));
    }
    return {
        size: transaction.meta?.computeUnitsConsumed || 0,
        totalInput: senders
            .reduce((acc, curr) => acc.plus(curr.amount.abs()), new BigNumber(0))
            .toString(),
        totalOutput: receivers
            .reduce((acc, curr) => acc.plus(curr.amount.abs()), new BigNumber(0))
            .toString(),
        vin,
        vout,
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

type TokenTransferInstruction = {
    program: 'spl-token';
    programId: PublicKey;
    parsed: {
        type: 'transferChecked' | 'transfer';
        info: {
            destination: string;
            authority: string;
            multisigAuthority?: string;
            source: string;
            mint?: string;
            tokenAmount?: {
                amount: string;
                decimals: number;
            };
            amount?: string;
        };
    };
};

const isTokenTransferInstruction = (
    ix: ParsedInstruction | PartiallyDecodedInstruction,
): ix is TokenTransferInstruction => {
    if (!('parsed' in ix)) {
        return false;
    }

    const { parsed } = ix;

    return (
        'program' in ix &&
        typeof ix.program === 'string' &&
        ix.program === 'spl-token' &&
        'type' in parsed &&
        typeof parsed.type === 'string' &&
        (parsed.type === 'transferChecked' || parsed.type === 'transfer') &&
        'info' in parsed &&
        typeof parsed.info === 'object' &&
        (('authority' in parsed.info && typeof parsed.info.authority === 'string') ||
            ('multisigAuthority' in parsed.info &&
                typeof parsed.info.multisigAuthority === 'string')) &&
        'source' in parsed.info &&
        typeof parsed.info.source === 'string' &&
        'destination' in parsed.info &&
        typeof parsed.info.destination === 'string' &&
        (('tokenAmount' in parsed.info &&
            typeof parsed.info.tokenAmount === 'object' &&
            'amount' in parsed.info.tokenAmount &&
            typeof parsed.info.tokenAmount.amount === 'string') ||
            ('amount' in parsed.info && typeof parsed.info.amount === 'string'))
    );
};

export const getTokens = (
    tx: ParsedTransactionWithMeta,
    accountAddress: string,
    tokenDetailByMint: TokenDetailByMint,
    tokenAccountsInfos: SolanaTokenAccountInfo[],
): TokenTransfer[] => {
    const getUiType = ({ parsed }: TokenTransferInstruction) => {
        const accountAddresses = [
            ...tokenAccountsInfos.map(({ address }) => address),
            accountAddress,
        ];
        const isAccountDestination = accountAddresses.includes(parsed.info.destination);

        const isAccountSource = accountAddresses.includes(
            parsed.info.multisigAuthority || parsed.info.authority || parsed.info.source,
        );

        if (isAccountDestination && isAccountSource) {
            return 'self';
        }
        if (isAccountDestination) {
            return 'recv';
        }
        return 'sent';
    };

    const matchTokenAccountInfo = ({ parsed }: TokenTransferInstruction, address: string) =>
        address === parsed.info?.source ||
        address === parsed.info.destination ||
        address === parsed.info?.authority;

    const effects = tx.transaction.message.instructions
        .filter(isTokenTransferInstruction)
        .map<TokenTransfer>((ix): TokenTransfer => {
            const { parsed } = ix;

            // some data, like `mint` and `decimals` may not be present in the instruction, but can be found in the token account info
            // so we try to find the token account info that matches the instruction and use it's data
            const instructionTokenInfo = tokenAccountsInfos.find(tokenAccountInfo =>
                matchTokenAccountInfo(ix, tokenAccountInfo.address),
            );

            // when sending tokens to associated token account, the instruction does not contain mint
            const mint = parsed.info.mint || instructionTokenInfo?.mint || 'Unknown token contract';

            const decimals =
                parsed.info.tokenAmount?.decimals || instructionTokenInfo?.decimals || 0;
            const amount = parsed.info.tokenAmount?.amount || parsed.info.amount || '-1';

            const source = parsed.info.authority || parsed.info.source;

            // if sending/receiving to associated token account, we replace the tokenAccount address with the associated token account address
            // to simplify the information for the user since teh UI does not recognize the concept of associated token accounts
            const from = source === instructionTokenInfo?.address ? accountAddress : source;

            const to =
                parsed.info.destination === instructionTokenInfo?.address
                    ? accountAddress
                    : parsed.info.destination;

            return {
                type: getUiType(ix),
                standard: 'SPL',
                from,
                to,
                contract: mint,
                decimals,
                ...getTokenNameAndSymbol(mint, tokenDetailByMint),
                amount,
            };
        });

    return effects;
};

export const transformTransaction = (
    tx: SolanaValidParsedTxWithMeta,
    accountAddress: string,
    tokenAccountsInfos: SolanaTokenAccountInfo[],
    tokenDetailByMint: TokenDetailByMint,
): Transaction => {
    const nativeEffects = getNativeEffects(tx);

    const tokens = getTokens(tx, accountAddress, tokenDetailByMint, tokenAccountsInfos);

    const type = getTxType(tx, nativeEffects, accountAddress, tokens);

    const targets = getTargets(nativeEffects, type, accountAddress);

    const amount = getAmount(
        nativeEffects.find(({ address }) => address === accountAddress),
        type,
    );

    const details = getDetails(tx, nativeEffects, accountAddress, type);

    return {
        type,
        txid: tx.transaction.signatures[0].toString(),
        blockTime: tx.blockTime,
        amount,
        fee: tx.meta.fee.toString(),
        targets,
        tokens,
        internalTransfers: [], // not relevant for solana
        details,
        blockHash: tx.transaction.message.recentBlockhash,
        solanaSpecific: {
            status: 'confirmed',
        },
    };
};
