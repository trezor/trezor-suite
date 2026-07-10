import {
    type Instruction,
    decompileTransactionMessage,
    getBase16Encoder,
    getCompiledTransactionMessageDecoder,
    getTransactionDecoder,
    pipe,
} from '@solana/kit';
import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    ComputeBudgetInstruction,
    identifyComputeBudgetInstruction,
    parseSetComputeUnitLimitInstruction,
    parseSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';
import {
    SYSTEM_PROGRAM_ADDRESS,
    SystemInstruction,
    identifySystemInstruction,
    parseCreateAccountInstruction,
    parseTransferSolInstruction,
} from '@solana-program/system';
import {
    TOKEN_PROGRAM_ADDRESS,
    TokenInstruction,
    identifyTokenInstruction,
    parseTransferCheckedInstruction,
} from '@solana-program/token';

import { BigNumber } from '@trezor/utils';

const parseInstruction = (instruction: Instruction) => {
    // Fee decoding
    if (instruction.programAddress === COMPUTE_BUDGET_PROGRAM_ADDRESS && instruction.data) {
        const data = instruction.data as Uint8Array;
        const type = identifyComputeBudgetInstruction({ data });
        if (type === ComputeBudgetInstruction.SetComputeUnitPrice) {
            const parsed = parseSetComputeUnitPriceInstruction({
                data,
                programAddress: COMPUTE_BUDGET_PROGRAM_ADDRESS,
            });

            return { type: 'unit-price', parsed } as const;
        }
        if (type === ComputeBudgetInstruction.SetComputeUnitLimit) {
            const parsed = parseSetComputeUnitLimitInstruction({
                data,
                programAddress: COMPUTE_BUDGET_PROGRAM_ADDRESS,
            });

            return { type: 'unit-limit', parsed } as const;
        }
    }

    // Transfer instruction decoding
    if (
        instruction.programAddress === SYSTEM_PROGRAM_ADDRESS &&
        instruction.data &&
        instruction.accounts
    ) {
        const instructionSafe = {
            ...instruction,
            data: instruction.data as Uint8Array,
            accounts: instruction.accounts,
        };
        const type = identifySystemInstruction(instructionSafe);
        if (type === SystemInstruction.TransferSol) {
            const parsed = parseTransferSolInstruction(instructionSafe);

            return { type: 'transfer-sol', parsed } as const;
        }
        if (type === SystemInstruction.CreateAccount) {
            const parsed = parseCreateAccountInstruction(instructionSafe);

            return { type: 'create-account', parsed } as const;
        }
    }

    // Tokens
    if (
        instruction.programAddress === TOKEN_PROGRAM_ADDRESS &&
        instruction.data &&
        instruction.accounts
    ) {
        const instructionSafe = {
            ...instruction,
            data: instruction.data as Uint8Array,
            accounts: instruction.accounts,
        };
        const type = identifyTokenInstruction(instructionSafe);
        if (type === TokenInstruction.TransferChecked) {
            const parsed = parseTransferCheckedInstruction(instructionSafe);

            return { type: 'transfer-checked', parsed } as const;
        }
    }

    return { type: 'other' } as const;
};

const SOLANA_BASE_FEE = 5000; // lamports

export const getDecompiledMessage = (serializedTx: string, serialize: boolean) => {
    const messageBytes = serialize
        ? pipe(serializedTx, getBase16Encoder().encode, getTransactionDecoder().decode).messageBytes
        : getBase16Encoder().encode(serializedTx);
    const compiledMessage = pipe(messageBytes, getCompiledTransactionMessageDecoder().decode);
    const message = decompileTransactionMessage(compiledMessage);
    const baseFee = new BigNumber(SOLANA_BASE_FEE).multipliedBy(
        compiledMessage.header.numSignerAccounts,
    );
    const instructions = (message.instructions as readonly Instruction[]).map(parseInstruction);

    return { message, baseFee, instructions };
};
