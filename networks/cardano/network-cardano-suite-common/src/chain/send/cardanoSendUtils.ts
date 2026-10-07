import type { AccountAddresses, TokenInfo } from '@trezor/blockchain-link-types';
import type { PROTO } from '@trezor/connect-common';
import {
    type AccountType,
    type Output,
    coinAmountToSmallestUnit,
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    formatCoinAmount,
} from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

// Connect's Cardano constants, by value: importing them would load Connect's protobuf runtime.
const MAINNET_PROTOCOL_MAGIC = 764824073;
const TESTNET_LEGACY_PROTOCOL_MAGIC = 1097911063;
const MAINNET_NETWORK_ID = 1;
const BASE_ADDRESS_TYPE = 0 as PROTO.CardanoAddressType.BASE;

export const getDerivationType = (accountType: AccountType) => {
    switch (accountType) {
        case 'normal':
            return 1;
        case 'legacy':
            return 2;
        case 'ledger':
            return 0;
        default:
            return 1;
    }
};

export const getStakingPath = (account: { index: number }) => `m/1852'/1815'/${account.index}'/2/0`;

export const getProtocolMagic = (accountSymbol: NetworkSymbol) =>
    // TODO: use testnet magic from connect once this PR is merged https://github.com/trezor/connect/pull/1046
    accountSymbol === 'ada' ? MAINNET_PROTOCOL_MAGIC : TESTNET_LEGACY_PROTOCOL_MAGIC;

export const getAddressType = () => BASE_ADDRESS_TYPE;

export const getNetworkId = () => MAINNET_NETWORK_ID;

export const getUnusedChangeAddress = (account: { addresses?: AccountAddresses }) => {
    if (!account.addresses) return;

    // Find first unused change address or fallback to the last address if all are used (should not happen)
    const changeAddress =
        account.addresses.change.find(a => !a.transfers) ||
        account.addresses.change[account.addresses.change.length - 1];

    return changeAddress;
};

export const getAddressParameters = (account: { index: number }, path: string) => ({
    path,
    addressType: getAddressType(),
    stakingPath: getStakingPath(account),
});

/**
 * The send form's outputs as Cardano composing takes them: lovelace for ADA, the token's smallest
 * unit for native assets.
 *
 * @param decimals The coin's decimals.
 */
export const transformUserOutputs = (
    outputs: Output[],
    accountTokens: readonly TokenInfo[] | undefined,
    decimals: number,
    maxOutputIndex?: number,
) =>
    outputs.map((output, i) => {
        const setMax = i === maxOutputIndex;
        const amount =
            output.amount === '' ? undefined : coinAmountToSmallestUnit(output.amount, decimals);
        const tokenDecimals = accountTokens?.find(t => t.contract === output.token)?.decimals ?? 0;

        return {
            address: output.address === '' ? undefined : output.address,
            amount: output.token ? undefined : amount,
            assets: output.token
                ? [
                      {
                          unit: output.token,
                          quantity: output.amount
                              ? convertAmountUnitsToSubunits(output.amount, tokenDecimals)
                              : '0',
                      },
                  ]
                : [],
            setMax,
        };
    });

/**
 * Converts the 'max' amount coin selection returns in lovelace (or the token's smallest unit) to
 * ADA (or the token's unit).
 *
 * @param decimals The coin's decimals.
 */
export const formatMaxOutputAmount = (
    maxAmount: string | undefined,
    maxOutput: ReturnType<typeof transformUserOutputs>[number] | undefined,
    account: { tokens?: readonly TokenInfo[] },
    decimals: number,
) => {
    if (!maxOutput || !maxAmount) return maxAmount;
    if (maxOutput.assets.length === 0) {
        // output without asset, convert lovelaces to ADA
        return formatCoinAmount(maxAmount, decimals);
    }

    const { assets } = maxOutput;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const firstAsset: (typeof assets)[number] = assets[0];
    // output with a token, format using token decimals
    const tokenDecimals = account.tokens?.find(t => t.contract === firstAsset.unit)?.decimals ?? 0;

    return convertAmountSubunitsToUnits(maxAmount, tokenDecimals);
};
