import { type Address, address, createNoopSigner } from '@solana/kit';
import * as splToken from '@solana-program/token';
import * as splToken2022 from '@solana-program/token-2022';

import {
    getCreatedTokenAccounts,
    getSolanaTokenAccountInfos,
    parseTokenTransferInstruction,
} from './transactionInfo';

const baseAddress = address('5Q9c3XoBef8BYA5RzSmogWnRrQas6HPwYuo4AYPafpom');
const authority = createNoopSigner(address('ANctUhC7YZPueiv4T8bkDcHYEAJ7Hwoxhvgnr2QkF8uR'));
const mint = address('HBoNJ5v8g71s2boRivrHnfSB5MVPLDHHyVjruPfhGkvL');
const otherMint = address('So11111111111111111111111111111111111111112');
const source = address('6EjZ73R3oEUHQL4zczkx3pRD3acysP3ug7hwMAdzdtNQ');
const destination = address('73rsTqUoMd34Y3YwXtu4An2LkncLF9SeDY6TGUFfksfe');
const otherDestination = address('3nn86A71hFhoqYgPqLWSXdoxUwtfJNWoevBQUouAjSEg');

const getTransferInstruction = (
    tokenLibrary: typeof splToken | typeof splToken2022,
    tokenMint: Address = mint,
    tokenDestination: Address = destination,
) =>
    tokenLibrary.getTransferCheckedInstruction({
        amount: 1n,
        authority,
        decimals: 6,
        destination: tokenDestination,
        mint: tokenMint,
        source,
    });

describe('Solana transaction info', () => {
    it.each([
        ['SPL Token', splToken, 'spl-token'],
        ['Token-2022', splToken2022, 'spl-token-2022'],
    ] as const)('parses %s transfer-checked instructions', (_, tokenLibrary, expectedProgram) => {
        const parsedInstruction = parseTokenTransferInstruction(
            getTransferInstruction(tokenLibrary),
        );

        expect(parsedInstruction?.tokenProgramName).toBe(expectedProgram);
        expect(parsedInstruction?.parsed.accounts.mint.address).toBe(mint);
        expect(parsedInstruction?.parsed.accounts.destination.address).toBe(destination);
    });

    it.each([
        ['SPL Token', splToken, splToken.TOKEN_PROGRAM_ADDRESS],
        ['Token-2022', splToken2022, splToken2022.TOKEN_2022_PROGRAM_ADDRESS],
    ] as const)(
        'returns only the %s transfer targeting the base address ATA',
        async (_, tokenLibrary, tokenProgram) => {
            const [expectedTokenAccount] = await tokenLibrary.findAssociatedTokenPda({
                mint,
                owner: baseAddress,
                tokenProgram,
            });
            const tokenAccountInfos = await getSolanaTokenAccountInfos({
                baseAddress,
                instructions: [
                    getTransferInstruction(tokenLibrary, mint, otherDestination),
                    getTransferInstruction(tokenLibrary, otherMint, otherDestination),
                    getTransferInstruction(tokenLibrary, mint, expectedTokenAccount),
                ],
                tokenMint: mint,
            });

            expect(tokenAccountInfos).toEqual([
                {
                    baseAddress,
                    tokenAccount: expectedTokenAccount,
                    tokenMint: mint,
                    tokenProgram,
                },
            ]);
        },
    );

    it.each([
        ['SPL Token', splToken, 'spl-token'],
        ['Token-2022', splToken2022, 'spl-token-2022'],
    ] as const)(
        'finds %s associated-token-account creation',
        (_, tokenLibrary, expectedProgram) => {
            const instruction = tokenLibrary.getCreateAssociatedTokenInstruction({
                ata: destination,
                mint,
                owner: baseAddress,
                payer: authority,
            });

            expect(getCreatedTokenAccounts([instruction])).toEqual([
                {
                    address: destination,
                    isIdempotent: false,
                    payer: authority.address,
                    tokenProgramName: expectedProgram,
                },
            ]);
        },
    );

    it('marks idempotent associated-token-account creation', () => {
        const instruction = splToken.getCreateAssociatedTokenIdempotentInstruction({
            ata: destination,
            mint,
            owner: baseAddress,
            payer: authority,
        });

        expect(getCreatedTokenAccounts([instruction])).toEqual([
            {
                address: destination,
                isIdempotent: true,
                payer: authority.address,
                tokenProgramName: 'spl-token',
            },
        ]);
    });
});
