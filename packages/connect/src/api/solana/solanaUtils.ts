import {
    type Blockhash,
    type CompilableTransactionMessage,
    type SignatureBytes,
    type Transaction,
    type TransactionMessage,
} from '@solana/kit';

import type { TokenAccount } from '@trezor/blockchain-link-types';
import { solanaUtils as SolanaBlockchainLinkUtils } from '@trezor/blockchain-link-utils';
import type { TokenProgramName } from '@trezor/blockchain-link-utils/src/solana';
import { BigNumber } from '@trezor/utils/src/bigNumber';

import type { Blockchain } from '../../backend/Blockchain';

const { SYSTEM_PROGRAM_PUBLIC_KEY, tokenProgramsInfo } = SolanaBlockchainLinkUtils;

const loadSolanaLib = async () =>
    await import(/* webpackChunkName: "vendor-solana-kit" */ '@solana/kit');
const loadSolanaComputeBudgetProgramLib = async () =>
    await import(
        /* webpackChunkName: "vendor-solana-program-compute-budget" */ '@solana-program/compute-budget'
    );
const loadSolanaSystemProgramLib = async () =>
    await import(/* webpackChunkName: "vendor-solana-program-system" */ '@solana-program/system');

const loadSolanaMemoProgramLib = async () =>
    await import(/* webpackChunkName: "vendor-solana-program-memo" */ '@solana-program/memo');

const loadSolanaTokenProgramLib = async (tokenProgramName: TokenProgramName) => {
    switch (tokenProgramName) {
        case 'spl-token':
            return await import(
                /* webpackChunkName: "vendor-solana-program-token" */ '@solana-program/token'
            );
        case 'spl-token-2022':
            return await import(
                /* webpackChunkName: "vendor-solana-program-token-2022" */ '@solana-program/token-2022'
            );
        default:
            throw new Error(`Unsupported token program: ${tokenProgramName}`);
    }
};

export const SOLANA_BASE_FEE = 5000; // lamports

export const getLamportsFromSol = (amountInSol: string) =>
    BigInt(new BigNumber(amountInSol).times(10 ** 9).toString());

type PriorityFees = { computeUnitPrice: string; computeUnitLimit: string };

export const dummyPriorityFeesForFeeEstimation: PriorityFees = {
    computeUnitPrice: '100000',
    computeUnitLimit: '200000',
};

async function createTransactionShimCommon(transaction: Transaction) {
    const { getBase16Codec, getTransactionEncoder } = await loadSolanaLib();

    return {
        addSignature(signerPubKey: string, signatureHex: string) {
            if (signerPubKey in transaction.signatures) {
                const signatureBytes = getBase16Codec().encode(signatureHex) as SignatureBytes;
                // Currently there's no public interface for adding a signature manually
                transaction = Object.freeze({
                    ...transaction,
                    signatures: Object.freeze({
                        ...transaction.signatures,
                        [signerPubKey]: signatureBytes,
                    }),
                });
            }
        },
        serializeMessage() {
            return getBase16Codec().decode(transaction.messageBytes);
        },
        serialize() {
            return getBase16Codec().decode(getTransactionEncoder().encode(transaction));
        },
    };
}

export async function createTransactionShim(message: CompilableTransactionMessage) {
    const { compileTransaction } = await loadSolanaLib();

    const transaction = compileTransaction(message);

    return createTransactionShimCommon(transaction);
}

export async function createTransactionShimFromHex(rawTx: string) {
    const { getBase16Encoder, getTransactionDecoder } = await loadSolanaLib();

    const txByteArray = getBase16Encoder().encode(rawTx);
    const transaction = getTransactionDecoder().decode(txByteArray);

    return createTransactionShimCommon(transaction);
}

const addPriorityFees = async <TMessage extends TransactionMessage>(
    message: TMessage,
    priorityFees: PriorityFees,
) => {
    const [
        // @solana/kit
        { prependTransactionMessageInstructions },
        // @solana-program/compute-budget
        { getSetComputeUnitLimitInstruction, getSetComputeUnitPriceInstruction },
    ] = await Promise.all([loadSolanaLib(), loadSolanaComputeBudgetProgramLib()]);

    return prependTransactionMessageInstructions(
        [
            getSetComputeUnitLimitInstruction({
                units: parseInt(priorityFees.computeUnitLimit, 10),
            }),
            getSetComputeUnitPriceInstruction({
                microLamports: parseInt(priorityFees.computeUnitPrice, 10),
            }),
        ],
        message,
    );
};

export const buildTransferTransaction = async (
    fromAddress: string,
    toAddress: string,
    amountInSol: string,
    blockhash: string,
    lastValidBlockHeight: number,
    priorityFees: PriorityFees,
    memo?: string,
) => {
    const [
        // @solana/kit
        {
            address,
            appendTransactionMessageInstruction,
            createTransactionMessage,
            lamports,
            setTransactionMessageLifetimeUsingBlockhash,
            setTransactionMessageFeePayer,
            createNoopSigner,
        },
        // @solana-program/system
        { getTransferSolInstruction },
    ] = await Promise.all([loadSolanaLib(), loadSolanaSystemProgramLib()]);
    const message = setTransactionMessageFeePayer(
        address(fromAddress),
        createTransactionMessage({ version: 'legacy' }),
    );
    const messageWithLifetime = setTransactionMessageLifetimeUsingBlockhash(
        {
            blockhash: blockhash as Blockhash,
            lastValidBlockHeight: BigInt(
                // FIXME: In tests, `lastValidBlockHeight` is sometimes `undefined`.
                lastValidBlockHeight ?? '0xFFFFFFFFFFFFFFFF',
            ),
        },
        message,
    );
    const messageWithTransfer = appendTransactionMessageInstruction(
        getTransferSolInstruction({
            amount: lamports(getLamportsFromSol(amountInSol)),
            destination: address(toAddress),
            source: createNoopSigner(address(fromAddress)),
        }),
        messageWithLifetime,
    );
    let messageWithFees: CompilableTransactionMessage = await addPriorityFees(
        messageWithTransfer,
        priorityFees,
    );
    if (memo) {
        const { getAddMemoInstruction } = await loadSolanaMemoProgramLib();
        messageWithFees = appendTransactionMessageInstruction(
            getAddMemoInstruction({ memo }),
            messageWithFees,
        );
    }

    return await createTransactionShim(messageWithFees);
};

// Construct the transfer instruction for a token transfer
// exported for testing
export const buildTokenTransferInstruction = async (
    from: string,
    to: string,
    owner: string,
    amount: BigNumber,
    mint: string,
    decimals: number,
    tokenProgramName: TokenProgramName,
) => {
    const [
        // @solana/kit
        { address, createNoopSigner },
        // @solana-program/token or @solana-program/token-2022
        { getTransferCheckedInstruction },
    ] = await Promise.all([loadSolanaLib(), loadSolanaTokenProgramLib(tokenProgramName)]);

    return getTransferCheckedInstruction({
        amount: BigInt(amount.toString()),
        authority: createNoopSigner(address(owner)),
        decimals,
        destination: address(to),
        mint: address(mint),
        source: address(from),
    });
};

export const getAssociatedTokenAccountAddress = async (
    baseAddress: string,
    tokenMintAddress: string,
    tokenProgramName: TokenProgramName,
) => {
    const [
        // @solana/kit
        { address },
        // @solana-program/token or @solana-program/token-2022
        { findAssociatedTokenPda },
    ] = await Promise.all([loadSolanaLib(), loadSolanaTokenProgramLib(tokenProgramName)]);

    const [pdaAddress] = await findAssociatedTokenPda({
        mint: address(tokenMintAddress),
        owner: address(baseAddress),
        tokenProgram: address(tokenProgramsInfo[tokenProgramName].publicKey),
    });

    return pdaAddress;
};

// Construct an instruction to create an associated token account. Used in token transfers
export const buildCreateAssociatedTokenAccountInstruction = async (
    funderAddress: string,
    newOwnerAddress: string,
    tokenMintAddress: string,
    tokenProgramName: TokenProgramName,
) => {
    const [
        // @solana/kit
        { address, createNoopSigner },
        // @solana-program/token or @solana-program/token-2022
        { getCreateAssociatedTokenInstruction },
    ] = await Promise.all([loadSolanaLib(), loadSolanaTokenProgramLib(tokenProgramName)]);

    const associatedTokenAccountAddress = await getAssociatedTokenAccountAddress(
        newOwnerAddress,
        tokenMintAddress,
        tokenProgramName,
    );

    const txInstruction = getCreateAssociatedTokenInstruction({
        ata: associatedTokenAccountAddress,
        mint: address(tokenMintAddress),
        owner: address(newOwnerAddress),
        payer: createNoopSigner(address(funderAddress)),
    });
    // @ts-expect-error - we are overriding this due to FW compatibility issue, it expects [] instead of [0]
    txInstruction.data = new Uint8Array([]);

    return [txInstruction, associatedTokenAccountAddress] as const;
};

type TokenTransferTxWithDestinationAddress = {
    transaction: {
        addSignature(signerPubKey: string, signatureHex: string): void;
        serializeMessage(): string;
        serialize(): string;
    };
    destinationAddress: string;
    tokenAccountInfo?: {
        baseAddress: string;
        tokenProgram: string;
        tokenMint: string;
        tokenAccount: string;
    };
};

// exported for testing
export const getMinimumRequiredTokenAccountsForTransfer = (
    tokenAccounts: TokenAccount[],
    requiredAmount: string,
) => {
    // sort the tokenAccounts from highest to lowest balance
    let accumulatedBalance = new BigNumber('0');
    const sorted = [...tokenAccounts].sort(
        (a, b) => new BigNumber(b.balance).comparedTo(new BigNumber(a.balance)) ?? 0,
    );
    const requiredAccounts: TokenAccount[] = [];
    for (const tokenAccount of sorted) {
        if (accumulatedBalance.gte(requiredAmount)) break;
        accumulatedBalance = accumulatedBalance.plus(tokenAccount.balance);
        requiredAccounts.push(tokenAccount);
    }

    return requiredAccounts;
};

export const buildTokenTransferTransaction = async (
    fromAddress: string,
    toAddress: string,
    toAddressOwner: string,
    tokenMint: string,
    tokenUiAmount: string,
    tokenDecimals: number,
    fromTokenAccounts: TokenAccount[],
    toTokenAccount: TokenAccount | undefined,
    blockhash: string,
    lastValidBlockHeight: number,
    priorityFees: PriorityFees,
    tokenProgramName: TokenProgramName,
    memo?: string,
): Promise<TokenTransferTxWithDestinationAddress> => {
    const {
        address,
        appendTransactionMessageInstruction,
        appendTransactionMessageInstructions,
        createTransactionMessage,
        setTransactionMessageFeePayer,
        setTransactionMessageLifetimeUsingBlockhash,
    } = await loadSolanaLib();

    const messageBase = setTransactionMessageFeePayer(
        address(fromAddress),
        createTransactionMessage({ version: 'legacy' }),
    );
    const messageWithLifetime = setTransactionMessageLifetimeUsingBlockhash(
        {
            blockhash: blockhash as Blockhash,
            lastValidBlockHeight: BigInt(
                // FIXME: In tests, `lastValidBlockHeight` is sometimes `undefined`.
                lastValidBlockHeight ?? '0xFFFFFFFFFFFFFFFF',
            ),
        },
        messageBase,
    );
    let message: CompilableTransactionMessage = await addPriorityFees(
        messageWithLifetime,
        priorityFees,
    );

    // Token transaction building logic

    const tokenAmount = new BigNumber(tokenUiAmount).times(10 ** tokenDecimals);

    // Step 1: Select all required token accounts and amounts we need to fulfill the transaction on the user's end
    const requiredAccounts = getMinimumRequiredTokenAccountsForTransfer(
        fromTokenAccounts,
        tokenAmount.toString(),
    );

    // Step 2: Check if the receiver address is a token account
    const isReceiverAddressSystemAccount = toAddressOwner === SYSTEM_PROGRAM_PUBLIC_KEY;

    let finalReceiverAddress = toAddress;
    if (isReceiverAddressSystemAccount) {
        // Step 3: If not, check if the receiver owns an associated token account
        if (toTokenAccount) {
            // If yes, use the first one.
            finalReceiverAddress = toTokenAccount.publicKey;
        } else {
            // Step 4: If not, create an associated token account for the receiver
            const [createAccountInstruction, associatedTokenAccountAddress] =
                await buildCreateAssociatedTokenAccountInstruction(
                    fromAddress,
                    toAddress,
                    tokenMint,
                    tokenProgramName,
                );

            // Add the account creation instruction to the transaction and use the newly created associated token account as the receiver
            message = appendTransactionMessageInstruction(createAccountInstruction, message);
            finalReceiverAddress = associatedTokenAccountAddress;
        }
    }

    // Step 5: Build the token transfer instruction(s)
    let remainingAmount = tokenAmount;
    const instructionPromises = requiredAccounts.map(async tokenAccount => {
        const transferAmount = BigNumber.min(remainingAmount, new BigNumber(tokenAccount.balance));

        const transferInstruction = await buildTokenTransferInstruction(
            tokenAccount.publicKey,
            finalReceiverAddress,
            fromAddress,
            transferAmount,
            tokenMint,
            tokenDecimals,
            tokenProgramName,
        );

        remainingAmount = remainingAmount.minus(transferAmount);

        return transferInstruction;
    });

    // Step 6: Add the token transfer instruction(s) to the transaction
    message = appendTransactionMessageInstructions(await Promise.all(instructionPromises), message);

    // Step 7: Append memo instruction if provided
    if (memo) {
        const { getAddMemoInstruction } = await loadSolanaMemoProgramLib();
        message = appendTransactionMessageInstruction(getAddMemoInstruction({ memo }), message);
    }

    // Step 8: Return the transaction
    return {
        transaction: await createTransactionShim(message),
        destinationAddress: finalReceiverAddress,
        tokenAccountInfo: isReceiverAddressSystemAccount
            ? {
                  baseAddress: toAddress,
                  tokenProgram: tokenProgramsInfo[tokenProgramName].publicKey,
                  tokenMint,
                  tokenAccount: finalReceiverAddress,
              }
            : undefined,
    };
};

export const fetchAccountOwnerAndTokenInfoForAddress = async (
    blockchain: Blockchain,
    address: string,
    mint: string,
    tokenProgram: TokenProgramName,
) => {
    // Fetch data about recipient account owner if this is a token transfer
    // We need this in order to validate the address and ensure transfers go through
    let accountOwner: string | undefined;
    let tokenInfo: TokenAccount | undefined;

    const accountInfoResponse = await blockchain.getAccountInfo({
        descriptor: address,
        details: 'tokens',
    });

    if (accountInfoResponse) {
        const associatedTokenAccount = await getAssociatedTokenAccountAddress(
            address,
            mint,
            tokenProgram,
        );

        accountOwner = accountInfoResponse?.misc?.owner;
        tokenInfo = accountInfoResponse?.tokens
            ?.find(token => token.contract === mint)
            ?.accounts?.find(account => associatedTokenAccount.toString() === account.publicKey);
    }

    return [accountOwner, tokenInfo] as const;
};
