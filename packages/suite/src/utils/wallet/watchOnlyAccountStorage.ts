import {
    type NetworkSymbol,
    getNetworkOptional,
    isNetworkSymbol,
} from '@suite-common/wallet-config';

const WATCH_ONLY_ACCOUNT_IMPORTS_STORAGE_KEY = '@trezor/suite/watch-only-account-imports/v1';

export type WatchOnlyAccountImportInstruction = {
    accountLabel?: string;
    descriptor: string;
    symbol: NetworkSymbol;
};
type WatchOnlyAccountIdentifier = Pick<WatchOnlyAccountImportInstruction, 'descriptor' | 'symbol'>;

const isWatchOnlyAccountImportInstruction = (
    value: unknown,
): value is WatchOnlyAccountImportInstruction => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const instruction = value as Record<string, unknown>;

    return (
        typeof instruction.descriptor === 'string' &&
        instruction.descriptor.length > 0 &&
        typeof instruction.symbol === 'string' &&
        isNetworkSymbol(instruction.symbol) &&
        (instruction.accountLabel === undefined || typeof instruction.accountLabel === 'string')
    );
};

const writeWatchOnlyAccountImportInstructions = (
    instructions: WatchOnlyAccountImportInstruction[],
) => {
    try {
        if (instructions.length > 0) {
            window.sessionStorage.setItem(
                WATCH_ONLY_ACCOUNT_IMPORTS_STORAGE_KEY,
                JSON.stringify(instructions),
            );
        } else {
            window.sessionStorage.removeItem(WATCH_ONLY_ACCOUNT_IMPORTS_STORAGE_KEY);
        }
    } catch {
        // Session storage is an optional convenience and must not block account management.
    }
};

export const getWatchOnlyAccountImportInstructions = (): WatchOnlyAccountImportInstruction[] => {
    try {
        const parsedInstructions: unknown = JSON.parse(
            window.sessionStorage.getItem(WATCH_ONLY_ACCOUNT_IMPORTS_STORAGE_KEY) ?? '[]',
        );

        return Array.isArray(parsedInstructions)
            ? parsedInstructions.filter(isWatchOnlyAccountImportInstruction)
            : [];
    } catch {
        return [];
    }
};

const getComparableDescriptor = ({ descriptor, symbol }: WatchOnlyAccountIdentifier) =>
    getNetworkOptional(symbol)?.networkType === 'ethereum' ? descriptor.toLowerCase() : descriptor;

export const isSameWatchOnlyAccount = (
    first: WatchOnlyAccountIdentifier,
    second: WatchOnlyAccountIdentifier,
) =>
    first.symbol === second.symbol &&
    getComparableDescriptor(first) === getComparableDescriptor(second);

const updateWatchOnlyAccountImportInstructions = (
    update: (
        instructions: WatchOnlyAccountImportInstruction[],
    ) => WatchOnlyAccountImportInstruction[],
) => writeWatchOnlyAccountImportInstructions(update(getWatchOnlyAccountImportInstructions()));

export const storeWatchOnlyAccountImportInstruction = (
    instruction: WatchOnlyAccountImportInstruction,
) =>
    updateWatchOnlyAccountImportInstructions(instructions => [
        ...instructions.filter(
            storedInstruction => !isSameWatchOnlyAccount(storedInstruction, instruction),
        ),
        instruction,
    ]);

export const removeWatchOnlyAccountImportInstruction = (instruction: WatchOnlyAccountIdentifier) =>
    updateWatchOnlyAccountImportInstructions(instructions =>
        instructions.filter(
            storedInstruction => !isSameWatchOnlyAccount(storedInstruction, instruction),
        ),
    );

export const removeWatchOnlyAccountImportInstructionsBySymbol = (symbol: NetworkSymbol) =>
    updateWatchOnlyAccountImportInstructions(instructions =>
        instructions.filter(storedInstruction => storedInstruction.symbol !== symbol),
    );
