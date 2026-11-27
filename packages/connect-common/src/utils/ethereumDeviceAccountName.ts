import { HD_HARDENED_PATH_PART, fromHardenedPathPart, getHDPath } from '@trezor/crypto-utils';

// Port of the firmware's `get_account_and_path`: the first of the Ethereum signing path patterns
// (`apps/ethereum/keychain.py` PATTERNS_ADDRESS) the path matches numbers the account.

type PathStep = { hardened: boolean; min: number; max: number } | 'hardenedCoinType' | 'coinType';

const hardened = (min: number, max = min): PathStep => ({ hardened: true, min, max });
const unhardened = (min: number, max = min): PathStep => ({ hardened: false, min, max });

const ACCOUNT_RANGE = [0, 100] as const;
const CHANGE_RANGE = [0, 1] as const;
const ADDRESS_INDEX_RANGE = [0, 1_000_000] as const;

const PATTERNS: ReadonlyArray<{ steps: PathStep[]; accountStep: number }> = [
    // m/44'/coin_type'/0'/0/account
    {
        steps: [
            hardened(44),
            'hardenedCoinType',
            hardened(0),
            unhardened(0),
            unhardened(...ACCOUNT_RANGE),
        ],
        accountStep: 4,
    },
    // m/44'/coin_type'/account'/change/address_index
    {
        steps: [
            hardened(44),
            'hardenedCoinType',
            hardened(...ACCOUNT_RANGE),
            unhardened(...CHANGE_RANGE),
            unhardened(...ADDRESS_INDEX_RANGE),
        ],
        accountStep: 2,
    },
    // m/44'/coin_type'/account'
    { steps: [hardened(44), 'hardenedCoinType', hardened(...ACCOUNT_RANGE)], accountStep: 2 },
    // m/44'/coin_type'/0'/account
    {
        steps: [hardened(44), 'hardenedCoinType', hardened(0), unhardened(...ACCOUNT_RANGE)],
        accountStep: 3,
    },
    // m/45'/coin_type/account/change/address_index
    {
        steps: [
            hardened(45),
            'coinType',
            unhardened(...ACCOUNT_RANGE),
            unhardened(...CHANGE_RANGE),
            unhardened(...ADDRESS_INDEX_RANGE),
        ],
        accountStep: 2,
    },
];

const isHardened = (pathPart: number) => (pathPart & HD_HARDENED_PATH_PART) !== 0;

const matchesStep = (pathPart: number, step: PathStep) => {
    // The coin type is taken from the path itself, so it always matches its own hardening.
    if (step === 'coinType') return true;
    if (step === 'hardenedCoinType') return isHardened(pathPart);
    const value = fromHardenedPathPart(pathPart);

    return isHardened(pathPart) === step.hardened && value >= step.min && value <= step.max;
};

/** The name the device shows for the signing account, e.g. `ETH #1`, for the `@.from` path. */
export const getEthereumDeviceAccountName = (path: string) => {
    const parsedPath = getHDPath(path);
    if (!parsedPath.success) {
        return undefined;
    }
    const pathParts = parsedPath.payload;
    const pattern = PATTERNS.find(
        ({ steps }) =>
            steps.length === pathParts.length &&
            steps.every((step, index) => matchesStep(pathParts[index] ?? 0, step)),
    );
    const accountPart = pattern && pathParts[pattern.accountStep];

    // The firmware writes "ETH" whatever the network.
    return accountPart === undefined ? undefined : `ETH #${fromHardenedPathPart(accountPart) + 1}`;
};
