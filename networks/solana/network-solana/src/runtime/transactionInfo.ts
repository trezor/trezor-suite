import { type Instruction, address } from '@solana/kit';
import * as splToken from '@solana-program/token';
import * as splToken2022 from '@solana-program/token-2022';

import { type TokenProgramName } from '../types';

export type SolanaTxTokenAccountInfo = {
    baseAddress: string;
    tokenProgram: string;
    tokenMint: string;
    tokenAccount: string;
};

export type CreatedTokenAccount = {
    address: string;
    payer: string;
    tokenProgramName: TokenProgramName;
    isIdempotent: boolean;
};

export const parseTokenTransferInstruction = (instruction: Instruction) => {
    if (!instruction.data || !instruction.accounts) {
        return undefined;
    }

    const instructionSafe = {
        ...instruction,
        data: instruction.data as Uint8Array,
        accounts: instruction.accounts,
    };

    if (instruction.programAddress === splToken.TOKEN_PROGRAM_ADDRESS) {
        const instructionType = splToken.identifyTokenInstruction(instructionSafe);

        if (instructionType !== splToken.TokenInstruction.TransferChecked) {
            return undefined;
        }

        return {
            parsed: splToken.parseTransferCheckedInstruction(instructionSafe),
            tokenProgramName: 'spl-token',
        } as const;
    }

    if (instruction.programAddress === splToken2022.TOKEN_2022_PROGRAM_ADDRESS) {
        const instructionType = splToken2022.identifyToken2022Instruction(instructionSafe);

        if (instructionType !== splToken2022.Token2022Instruction.TransferChecked) {
            return undefined;
        }

        return {
            parsed: splToken2022.parseTransferCheckedInstruction(instructionSafe),
            tokenProgramName: 'spl-token-2022',
        } as const;
    }

    return undefined;
};

type GetSolanaTokenAccountInfosParams = {
    baseAddress: string;
    instructions: readonly Instruction[];
    tokenMint: string;
};

export const getSolanaTokenAccountInfos = async ({
    baseAddress,
    instructions,
    tokenMint,
}: GetSolanaTokenAccountInfosParams): Promise<SolanaTxTokenAccountInfo[]> => {
    const resolvedTokenAccountInfos = await Promise.all(
        instructions.map(async instruction => {
            const transferInstruction = parseTokenTransferInstruction(instruction);

            if (transferInstruction?.parsed.accounts.mint.address !== tokenMint) {
                return;
            }

            const tokenLibrary =
                transferInstruction.tokenProgramName === 'spl-token' ? splToken : splToken2022;
            const tokenProgram =
                transferInstruction.tokenProgramName === 'spl-token'
                    ? splToken.TOKEN_PROGRAM_ADDRESS
                    : splToken2022.TOKEN_2022_PROGRAM_ADDRESS;
            const [expectedTokenAccount] = await tokenLibrary.findAssociatedTokenPda({
                mint: address(tokenMint),
                owner: address(baseAddress),
                tokenProgram: address(tokenProgram),
            });
            const tokenAccount = transferInstruction.parsed.accounts.destination.address;

            if (tokenAccount !== expectedTokenAccount) {
                return;
            }

            return {
                baseAddress,
                tokenAccount,
                tokenMint,
                tokenProgram,
            };
        }),
    );
    const uniqueTokenAccountInfos = new Map<string, SolanaTxTokenAccountInfo>();
    resolvedTokenAccountInfos.forEach(tokenAccountInfo => {
        if (tokenAccountInfo) {
            uniqueTokenAccountInfos.set(tokenAccountInfo.tokenAccount, tokenAccountInfo);
        }
    });

    return Array.from(uniqueTokenAccountInfos.values());
};

export const getCreatedTokenAccounts = (
    instructions: readonly Instruction[],
): CreatedTokenAccount[] =>
    instructions.flatMap(instruction => {
        if (
            instruction.programAddress !== splToken.ASSOCIATED_TOKEN_PROGRAM_ADDRESS ||
            !instruction.accounts
        ) {
            return [];
        }

        const discriminator = instruction.data?.[0] ?? 0;
        if (discriminator !== 0 && discriminator !== 1) {
            return [];
        }

        const payer = instruction.accounts[0]?.address;
        const tokenAccount = instruction.accounts[1]?.address;
        const tokenProgramAccount = instruction.accounts.find(
            account =>
                account.address === splToken.TOKEN_PROGRAM_ADDRESS ||
                account.address === splToken2022.TOKEN_2022_PROGRAM_ADDRESS,
        );
        if (!payer || !tokenAccount || !tokenProgramAccount) {
            return [];
        }

        return [
            {
                address: tokenAccount,
                isIdempotent: discriminator === 1,
                payer,
                tokenProgramName:
                    tokenProgramAccount.address === splToken.TOKEN_PROGRAM_ADDRESS
                        ? ('spl-token' as const)
                        : ('spl-token-2022' as const),
            },
        ];
    });
