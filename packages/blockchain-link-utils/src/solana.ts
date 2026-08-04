import type {
    InternalTransfer,
    StakeType,
    Target,
    TokenDetailByMint,
    TokenInfo,
    TokenStandard,
    TokenTransfer,
    Transaction,
} from '@trezor/blockchain-link-types/src';
import { isCodesignBuild } from '@trezor/env-utils';
import {
    ASSOCIATED_TOKEN_PROGRAM_PUBLIC_KEY,
    COMPUTE_BUDGET_PROGRAM_ID,
    MEMO_PROGRAM_PUBLIC_KEY,
    MEMO_PROGRAM_PUBLIC_KEY_V1,
    SERUM_ASSET_OWNER_PHANTOM_DEPLOYMENT_PROGRAM_ID,
    SERUM_ASSET_OWNER_PROGRAM_ID,
    STAKE_PROGRAM_PUBLIC_KEY,
    SYSTEM_PROGRAM_PUBLIC_KEY,
    WSOL_MINT,
    tokenProgramNames,
    tokenProgramsInfo,
} from '@trezor/network-solana/constants';
import type {
    AccountInfo,
    Address,
    ParsedAccountData,
    ParsedInstruction,
    ParsedTransactionWithMeta,
    PartiallyDecodedInstruction,
    SolanaTokenAccountInfo,
    SolanaValidParsedTxWithMeta,
    TokenProgramName,
} from '@trezor/network-solana/types';
import { arrayPartition, isArrayMember, isNotNullOrUndefined } from '@trezor/utils';
import { BigNumber } from '@trezor/utils/src/bigNumber';

export type ApiTokenAccount = {
    account: AccountInfo<ParsedAccountData>;
    pubkey: Address;
};

export const getTokenMetadata = async (): Promise<TokenDetailByMint> => {
    const env = isCodesignBuild() ? 'stable' : 'develop';

    const response = await fetch(
        `https://data.trezor.io/suite/definitions/${env}/solana.advanced.coin.definitions.v1.json`,
    );

    if (!response.ok) {
        throw Error(response.statusText);
    }

    const parsed: unknown = await response.json();

    // The body comes verbatim from an unsigned CDN (data.trezor.io) that is NOT JWS-verified and is
    // thus attacker/MITM-controllable. A JSON `null` (or primitive) body would make the
    // `data[WSOL_MINT] = ...` assignment below throw ("Cannot set properties of null") — and callers'
    // `tokenDetailByMint[mint]` derefs throw too — aborting the whole solana getAccountInfo/discovery
    // (per-account DoS). Coerce to a plain object at this data boundary.
    const data: TokenDetailByMint =
        parsed !== null && typeof parsed === 'object' ? (parsed as TokenDetailByMint) : {};

    // Explicitly set Wrapped SOL symbol to wSol instead of the official 'SOL' which leads to confusion in UI
    data[WSOL_MINT] = { symbol: 'wSOL', name: 'Wrapped SOL' };

    return data;
};

export const getTokenNameAndSymbol = (mint: string, tokenDetailByMint: TokenDetailByMint) => {
    const tokenDetail = tokenDetailByMint[mint];

    return tokenDetail
        ? { name: tokenDetail.name, symbol: tokenDetail.symbol }
        : {
              name: mint,
              symbol: mint,
          };
};

const isTokenProgramName = (programName: string): programName is TokenProgramName =>
    isArrayMember(programName, tokenProgramNames);

export const tokenStandardToTokenProgramName = (standard: TokenStandard): TokenProgramName => {
    const tokenProgram = Object.entries(tokenProgramsInfo).find(
        ([_, programInfo]) => programInfo.tokenStandard === standard,
    );
    if (!tokenProgram)
        throw new Error(`Cannot convert token standard ${standard} to Solana token program name`);

    return tokenProgram[0] as TokenProgramName;
};

type SplTokenAccountData = {
    /** Name of the program that owns this account */
    program: TokenProgramName;
    /** Parsed account data */
    parsed: {
        info: {
            mint: string;
            tokenAmount: {
                amount: string;
                decimals: number;
            };
        };
        type: string;
    };
    /** Space used by account data */
    space: bigint;
};

type SplTokenAccount = { account: AccountInfo<SplTokenAccountData>; pubkey: Address };

const isSplTokenAccount = (tokenAccount: ApiTokenAccount): tokenAccount is SplTokenAccount => {
    // The values below come verbatim from an untrusted, user-selectable Solana RPC backend,
    // so every deref must be shape-checked before the `in` operator or a property access:
    // `'x' in y` throws a TypeError when `y` is not an object, and a single poison token
    // account record would otherwise crash transformTokenInfo over the whole account page.
    const data = tokenAccount?.account?.data;

    if (!data || typeof data !== 'object') return false;

    const { parsed } = data;

    return (
        isTokenProgramName(data.program) &&
        !!parsed &&
        typeof parsed === 'object' &&
        'info' in parsed &&
        !!parsed.info &&
        typeof parsed.info === 'object' &&
        'mint' in parsed.info &&
        typeof parsed.info.mint === 'string' &&
        'tokenAmount' in parsed.info &&
        !!parsed.info.tokenAmount &&
        typeof parsed.info.tokenAmount === 'object' &&
        'amount' in parsed.info.tokenAmount &&
        typeof parsed.info.tokenAmount.amount === 'string' &&
        'decimals' in parsed.info.tokenAmount &&
        typeof parsed.info.tokenAmount.decimals === 'number'
    );
};

export const transformTokenInfo = (
    tokenAccounts: readonly ApiTokenAccount[],
    tokenDetailByMint: TokenDetailByMint,
) => {
    const acc: { [mint: string]: TokenInfo } = {};
    // since ApiTokenAccount type is not precise enough, we type-guard the account to make sure they contain all the necessary data
    for (const tokenAccount of tokenAccounts) {
        if (!isSplTokenAccount(tokenAccount)) continue;
        const {
            parsed: { info },
            program,
        } = tokenAccount.account.data;
        const token = {
            type: tokenProgramsInfo[program].tokenStandard,
            contract: info.mint,
            balance: info.tokenAmount.amount,
            decimals: info.tokenAmount.decimals,
            ...getTokenNameAndSymbol(info.mint, tokenDetailByMint),
            address: tokenAccount.pubkey,
            standard: tokenProgramsInfo[program].tokenStandard,
        };
        const existing = acc[token.contract];
        if (existing != null) {
            existing.balance = new BigNumber(existing.balance || '0')
                .plus(token.balance || '0')
                .toString();
            existing.accounts?.push({
                publicKey: token.address,
                balance: token.balance || '0',
            });
        } else {
            const { standard, contract, balance, decimals, name, symbol } = token;
            acc[token.contract] = {
                standard,
                contract,
                balance,
                decimals,
                name,
                symbol,
                accounts: [{ publicKey: token.address, balance: balance || '0' }],
            };
        }
    }
    const tokens: TokenInfo[] = Object.values(acc);

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
        ak => ak.pubkey === address,
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
        preBalance: new BigNumber(preBalance?.toString(10) ?? 0),
        postBalance: new BigNumber(postBalance?.toString(10) ?? 0),
    };
};

const isWSolTransfer = (ixs: readonly (ParsedInstruction | PartiallyDecodedInstruction)[]) =>
    ixs.find(
        ix =>
            'parsed' in ix &&
            !!ix.parsed.info &&
            'mint' in ix.parsed.info &&
            ix.parsed.info.mint === WSOL_MINT,
    );

type TransactionEffect = {
    address: Address;
    amount: BigNumber;
};

export function getNativeEffects(transaction: ParsedTransactionWithMeta): TransactionEffect[] {
    const wSolTransferInstruction = isWSolTransfer(
        transaction.transaction.message.instructions || [],
    );

    return transaction.transaction.message.accountKeys
        .map(ak => {
            const targetAddress = ak.pubkey;
            const balanceDiff = extractAccountBalanceDiff(transaction, targetAddress);

            // WSOL Transfers are counted as SOL transfers in the transaction effects, leading to duplicate
            // entries in the tx history. This serves to filter out the WSOL transfers from the native effects.
            if (wSolTransferInstruction && 'parsed' in wSolTransferInstruction) {
                if (
                    (!!wSolTransferInstruction.parsed.info &&
                        'destination' in wSolTransferInstruction.parsed.info &&
                        wSolTransferInstruction.parsed.info.destination === targetAddress) ||
                    (!!wSolTransferInstruction.parsed.info &&
                        'source' in wSolTransferInstruction.parsed.info &&
                        wSolTransferInstruction.parsed.info.source === targetAddress)
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
        .filter(isNotNullOrUndefined)
        .filter(({ amount }) => !amount.isZero()); // filter out zero effects
}

const isUnknownProgramInstruction = (
    instruction: ParsedTransactionWithMeta['transaction']['message']['instructions'][number],
) =>
    ![
        SYSTEM_PROGRAM_PUBLIC_KEY,
        ...Object.values(tokenProgramsInfo).map(info => info.publicKey),
        ASSOCIATED_TOKEN_PROGRAM_PUBLIC_KEY,
        STAKE_PROGRAM_PUBLIC_KEY,
        COMPUTE_BUDGET_PROGRAM_ID,
        // some wallets use Serum's Assert Owner program during SPL transfer transactions
        SERUM_ASSET_OWNER_PROGRAM_ID,
        SERUM_ASSET_OWNER_PHANTOM_DEPLOYMENT_PROGRAM_ID,
        MEMO_PROGRAM_PUBLIC_KEY,
        MEMO_PROGRAM_PUBLIC_KEY_V1,
    ].includes(instruction.programId);

export const hasUnknownProgramInstructions = (transaction: ParsedTransactionWithMeta) =>
    transaction.transaction.message.instructions.some(isUnknownProgramInstruction);

export const getTargets = (
    effects: TransactionEffect[],
    txType: Transaction['type'],
    accountAddress: string,
    hasOwnBalanceInternalTransfers: boolean,
): Transaction['targets'] =>
    effects
        .filter(effect => {
            // exclude target for 'self` transaction because it is redundant with fee
            if (txType === 'self') {
                return false;
            }
            // ignore all targets for unknown transactions
            if (txType === 'unknown') {
                return false;
            }

            // the account's own balance change is represented as an internal transfer
            if (hasOwnBalanceInternalTransfers) {
                return false;
            }

            // Exclude effects on foreign addresses for tx types other than sent, otherwise it
            // leads to the foreign address being displayed next to user's own address which might lead to confusion.
            if (txType !== 'sent' && effect.address !== accountAddress) {
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

function getTransactionStakeType(tx: ParsedTransactionWithMeta): StakeType | undefined {
    const { instructions } = tx.transaction.message;

    if (!instructions) {
        throw new Error('Invalid transaction data');
    }

    for (const instruction of instructions) {
        if (instruction.programId === STAKE_PROGRAM_PUBLIC_KEY && 'parsed' in instruction) {
            const { type } = instruction.parsed || {};

            if (type === 'delegate') return 'stake';
            if (type === 'deactivate') return 'unstake';
            if (type === 'withdraw') return 'claim';
        }
    }

    return undefined;
}

export const getInternalTransfers = (
    transaction: ParsedTransactionWithMeta,
    effects: TransactionEffect[],
    accountAddress: string,
): InternalTransfer[] => {
    const emitsOwnBalanceChange =
        hasUnknownProgramInstructions(transaction) ||
        getTransactionStakeType(transaction) === 'claim';
    if (!emitsOwnBalanceChange) {
        return [];
    }

    const feePayer = transaction.transaction.message.accountKeys[0]?.pubkey;
    const fee = new BigNumber(transaction.meta?.fee.toString() || 0);

    return effects
        .filter(effect => effect.address === accountAddress)
        .flatMap(effect => {
            // the fee payer's balance change includes the fee, which is reported separately
            const amount = effect.address === feePayer ? effect.amount.plus(fee) : effect.amount;

            if (amount.isZero()) {
                return [];
            }

            const type = amount.isNegative() ? 'sent' : 'recv';

            return {
                type,
                from: type === 'sent' ? accountAddress : '',
                to: type === 'recv' ? accountAddress : '',
                amount: amount.abs().toString(),
            };
        });
};

const getTokenTransferTxType = (transfers: TokenTransfer[]) => {
    if (transfers.some(transfer => transfer.to === transfer.from)) {
        return 'self';
    }

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
        effects[0]?.amount.abs().isEqualTo(new BigNumber(transaction.meta?.fee.toString() || 0))
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

    // classify by balance changes when instructions alone cannot determine the type
    const getTxTypeFromBalanceChanges = (): Transaction['type'] => {
        // the fee payer signed and funded the transaction, which matches the semantics of `sent`
        const feePayer = transaction.transaction.message.accountKeys[0]?.pubkey;
        if (accountAddress === feePayer) {
            return 'sent';
        }

        if (tokenTransfers.length > 0) {
            const tokenTransferType = getTokenTransferTxType(tokenTransfers);
            if (tokenTransferType !== 'unknown') {
                return tokenTransferType;
            }
        }

        const accountEffect = effects.find(({ address }) => address === accountAddress);
        if (accountEffect?.amount.isGreaterThan(0)) {
            return 'recv';
        }

        const fee = new BigNumber(transaction.meta?.fee.toString() || 0);
        if (accountEffect?.amount.isNegative() && accountEffect.amount.abs().isGreaterThan(fee)) {
            return 'sent';
        }

        return 'unknown';
    };

    // transactions interacting with unknown programs cannot be classified from instructions,
    // mirroring ethereum, calling a program is not a special transaction type
    if (hasUnknownProgramInstructions(transaction)) {
        return getTxTypeFromBalanceChanges();
    }

    // then, we consider only parsed instructions because only based on them we can determine the type of transaction
    const parsedInstructions = transaction.transaction.message.instructions.filter(
        (instruction): instruction is ParsedInstruction => 'parsed' in instruction,
    );

    if (parsedInstructions.length === 0) {
        return getTxTypeFromBalanceChanges();
    }

    const isInstructionCreatingTokenAccount = (instruction: ParsedInstruction) =>
        instruction.program === 'spl-associated-token-account' &&
        (instruction.parsed.type === 'create' || instruction.parsed.type === 'createIdempotent');

    const isTransfer = parsedInstructions.every(
        instruction =>
            instruction.parsed.type === 'transfer' ||
            instruction.parsed.type === 'transferChecked' ||
            (instruction.program === 'system' && instruction.parsed.type === 'advanceNonce') ||
            isInstructionCreatingTokenAccount(instruction) ||
            instruction.programId === MEMO_PROGRAM_PUBLIC_KEY ||
            instruction.programId === MEMO_PROGRAM_PUBLIC_KEY_V1,
    );

    if (isTransfer) {
        return tokenTransfers.length > 0
            ? getTokenTransferTxType(tokenTransfers)
            : getNativeTransferTxType(effects, accountAddress, transaction);
    }

    return getTxTypeFromBalanceChanges();
};

export const getDetails = (
    transaction: ParsedTransactionWithMeta,
    effects: TransactionEffect[],
    accountAddress: string,
    txType: Transaction['type'],
): Transaction['details'] => {
    const senders = effects.filter(({ amount }) => amount.isNegative());

    // include positive effects only on accountAddress for tx types other then sent, otherwise it
    // leads to foreign address being displayed next to users own address which might lead to confusion
    const receivers = effects
        .filter(
            ({ amount, address }) =>
                amount.isPositive() && (txType !== 'sent' ? address === accountAddress : true),
        )
        .filter(({ address }) => !(txType === 'self' && address === accountAddress));

    const { signatures } = transaction.transaction;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const txSignature: string = signatures[0];

    const getVin = ({ address, amount }: { address: string; amount?: BigNumber }, i: number) => ({
        txid: txSignature.toString(),
        version: transaction.version?.toString(),
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
        size:
            transaction.meta?.computeUnitsConsumed != null
                ? Number(transaction.meta?.computeUnitsConsumed)
                : 0,
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
        // we do not want to show amount because its redundant with fee
        return '0';
    }

    return accountEffect.amount.abs().toString();
};

type TokenTransferInstruction = {
    program: TokenProgramName;
    programId: Address;
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
        isTokenProgramName(ix.program) &&
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
            !!parsed.info.tokenAmount &&
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

    const instructions = [
        ...tx.transaction.message.instructions,
        ...(tx.meta?.innerInstructions?.flatMap(innerIx => innerIx.instructions) ?? []),
    ];

    const effects = instructions
        // filter token transfer instructions that are relevant to the user token accounts
        .filter(
            (instruction): instruction is TokenTransferInstruction =>
                isTokenTransferInstruction(instruction) &&
                tokenAccountsInfos.some(tokenAccountInfo =>
                    matchTokenAccountInfo(instruction, tokenAccountInfo.address),
                ),
        )
        .map<TokenTransfer>((ix): TokenTransfer => {
            const { parsed, program } = ix;

            // some data, like `mint` and `decimals` may not be present in the instruction, but can be found in the token account info
            // so we try to find the token account info that matches the instruction and use it's data
            const instructionTokenInfo = tokenAccountsInfos.find(tokenAccountInfo =>
                matchTokenAccountInfo(ix, tokenAccountInfo.address),
            );

            // when sending tokens to associated token account, the instruction does not contain mint
            const mint = parsed.info.mint || instructionTokenInfo?.mint || 'Unknown token contract';

            const decimals = Number(
                parsed.info.tokenAmount?.decimals || instructionTokenInfo?.decimals || 0,
            );
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
                standard: tokenProgramsInfo[program].tokenStandard,
                from,
                to,
                contract: mint,
                decimals,
                ...getTokenNameAndSymbol(mint, tokenDetailByMint),
                amount,
            };
            // consider only effects on users address
        })
        .filter(effect => effect.to === accountAddress || effect.from === accountAddress);

    if (effects.length === 0) {
        // no transfer instructions to parse, derive token transfers from the account token balance changes
        return tokenAccountsInfos.flatMap(({ address, mint, decimals }) => {
            if (!mint) {
                return [];
            }

            const balanceDiff = extractAccountBalanceDiff(tx, address, true);
            if (!balanceDiff) {
                return [];
            }

            const amount = balanceDiff.postBalance.minus(balanceDiff.preBalance);
            if (amount.isZero()) {
                return [];
            }

            const type = amount.isNegative() ? 'sent' : 'recv';

            return [
                {
                    type,
                    standard: 'SPL',
                    from: type === 'sent' ? accountAddress : '',
                    to: type === 'recv' ? accountAddress : '',
                    contract: mint,
                    decimals: decimals ?? 0,
                    ...getTokenNameAndSymbol(mint, tokenDetailByMint),
                    amount: amount.abs().toString(),
                },
            ];
        });
    }

    return effects;
};

const getUnstakeAmount = (tx: SolanaValidParsedTxWithMeta): string => {
    const { transaction, meta } = tx;
    const { instructions, accountKeys } = transaction.message;

    if (!instructions || !meta) {
        throw new Error('Invalid transaction data');
    }

    const stakeAccountIndexes = instructions
        .filter(
            (instruction): instruction is ParsedInstruction =>
                instruction.programId === STAKE_PROGRAM_PUBLIC_KEY &&
                'parsed' in instruction &&
                instruction.parsed?.type === 'deactivate',
        )
        .map(instruction => {
            if (
                typeof instruction.parsed?.info === 'object' &&
                'stakeAccount' in instruction.parsed.info
            ) {
                const stakeAccount = instruction.parsed.info?.stakeAccount;

                return accountKeys.findIndex(key => key.pubkey === stakeAccount);
            }

            return -1;
        })
        .filter(index => index >= 0);

    const totalPostBalance = stakeAccountIndexes.reduce(
        (sum, stakeAccountIndex) =>
            sum.plus(new BigNumber(meta.postBalances[stakeAccountIndex]?.toString(10) || 0)),
        new BigNumber(0),
    );

    return totalPostBalance.toString();
};

const determineTransactionType = (
    type: Transaction['type'],
    stakeType?: StakeType,
): Transaction['type'] => {
    if (type !== 'unknown' || !stakeType) {
        return type;
    }

    switch (stakeType) {
        case 'claim':
        case 'stake':
        case 'unstake':
            return 'sent';
        default:
            return 'unknown';
    }
};

const getMemo = (tx: SolanaValidParsedTxWithMeta): string | undefined => {
    const memos = tx.transaction.message.instructions
        .filter(
            ix =>
                ix.programId === MEMO_PROGRAM_PUBLIC_KEY ||
                ix.programId === MEMO_PROGRAM_PUBLIC_KEY_V1,
        )
        .map(ix => ('parsed' in ix ? (ix.parsed as unknown) : undefined))
        .filter((p): p is string => typeof p === 'string');

    return memos.length > 0 ? memos.join('\n') : undefined;
};

export const transformTransaction = (
    tx: SolanaValidParsedTxWithMeta,
    accountAddress: string,
    tokenAccountsInfos: SolanaTokenAccountInfo[],
    tokenDetailByMint: TokenDetailByMint = {},
): Transaction => {
    const nativeEffects = getNativeEffects(tx);

    const tokens = getTokens(tx, accountAddress, tokenDetailByMint, tokenAccountsInfos);

    const type = getTxType(tx, nativeEffects, accountAddress, tokens);

    const stakeType = getTransactionStakeType(tx);

    const txType = determineTransactionType(type, stakeType);

    const internalTransfers = getInternalTransfers(tx, nativeEffects, accountAddress);

    const targets = getTargets(nativeEffects, txType, accountAddress, internalTransfers.length > 0);

    const isUnstakeTx = stakeType === 'unstake';

    const accountBalanceChange = getAmount(
        nativeEffects.find(({ address }) => address === accountAddress),
        type,
    );

    const amount =
        isUnstakeTx || internalTransfers.length > 0
            ? '0' // hidden, the movement is represented by stakeOperation or internalTransfers
            : accountBalanceChange;

    const stakeAmount = isUnstakeTx ? getUnstakeAmount(tx) : accountBalanceChange;

    const details = getDetails(tx, nativeEffects, accountAddress, type);

    const { signatures } = tx.transaction;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const txid: string = signatures[0];

    return {
        type: txType,
        txid: txid.toString(),
        blockTime: tx.blockTime == null ? undefined : Number(tx.blockTime),
        blockHeight: tx.slot == null ? undefined : Number(tx.slot),
        amount,
        fee: (tx.meta?.fee || 0).toString(),
        targets,
        tokens,
        internalTransfers,
        details,
        blockHash: tx.transaction.message.recentBlockhash,
        solanaSpecific: {
            status: 'confirmed',
            stakeOperation: stakeType
                ? {
                      type: stakeType,
                      amount: stakeAmount,
                  }
                : undefined,
            memo: getMemo(tx),
        },
    };
};
