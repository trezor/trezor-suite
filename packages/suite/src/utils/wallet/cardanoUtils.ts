import BigNumber from 'bignumber.js';

import {
    Account,
    Output,
    PrecomposedTransactionFinal,
    PrecomposedTransactionFinalCardano,
    PoolsResponse,
    StakePool,
} from '@suite-common/wallet-types';
import { CARDANO, CardanoCertificate, CardanoOutput, PROTO } from '@trezor/connect';
import {
    amountToSatoshi,
    formatAmount,
    formatNetworkAmount,
    networkAmountToSatoshi,
} from '@suite-common/wallet-utils';

export const getProtocolMagic = (accountSymbol: Account['symbol']) =>
    // TODO: use testnet magic from connect once this PR is merged https://github.com/trezor/connect/pull/1046
    accountSymbol === 'ada' ? CARDANO.PROTOCOL_MAGICS.mainnet : 1097911063;

export const getNetworkId = (accountSymbol: Account['symbol']) =>
    accountSymbol === 'ada' ? CARDANO.NETWORK_IDS.mainnet : CARDANO.NETWORK_IDS.testnet;

export const getAddressType = (_accountType: Account['accountType']) =>
    PROTO.CardanoAddressType.BASE;

export const getStakingPath = (account: Account) => `m/1852'/1815'/${account.index}'/2/0`;

export const getUnusedChangeAddress = (account: Pick<Account, 'addresses'>) => {
    if (!account.addresses) return;

    // Find first unused change address or fallback to the last address if all are used (should not happen)
    const changeAddress =
        account.addresses.change.find(a => !a.transfers) ||
        account.addresses.change[account.addresses.change.length - 1];

    return changeAddress;
};

export const getAddressParameters = (account: Account, path: string) => ({
    path,
    addressType: getAddressType(account.accountType),
    stakingPath: getStakingPath(account),
});

export const transformUserOutputs = (
    outputs: Output[],
    accountTokens: Account['tokens'],
    symbol: Account['symbol'],
    maxOutputIndex?: number,
) =>
    outputs.map((output, i) => {
        const setMax = i === maxOutputIndex;
        const amount =
            output.amount === '' ? undefined : networkAmountToSatoshi(output.amount, symbol);
        const tokenDecimals = accountTokens?.find(t => t.contract === output.token)?.decimals ?? 0;
        return {
            address: output.address === '' ? undefined : output.address,
            amount: output.token ? undefined : amount,
            assets: output.token
                ? [
                      {
                          unit: output.token,
                          quantity: output.amount
                              ? amountToSatoshi(output.amount, tokenDecimals)
                              : '0',
                      },
                  ]
                : [],
            setMax,
        };
    });

export const getShortFingerprint = (fingerprint: string) => {
    const firstPart = fingerprint.substring(0, 10);
    const lastPart = fingerprint.substring(fingerprint.length - 10);
    return `${firstPart}…${lastPart}`;
};

export const parseAsset = (
    hex: string,
): {
    policyId: string;
    assetNameInHex: string;
} => {
    const policyIdSize = 56;
    const policyId = hex.slice(0, policyIdSize);
    const assetNameInHex = hex.slice(policyIdSize);
    return {
        policyId,
        assetNameInHex,
    };
};

export const getDelegationCertificates = (
    stakingPath: string,
    poolHex: string | undefined,
    shouldRegister: boolean,
) => {
    const result: CardanoCertificate[] = [
        {
            type: PROTO.CardanoCertificateType.STAKE_DELEGATION,
            path: stakingPath,
            pool: poolHex,
        },
    ];

    if (shouldRegister) {
        result.unshift({
            type: PROTO.CardanoCertificateType.STAKE_REGISTRATION,
            path: stakingPath,
        });
    }

    return result;
};

export const isPoolOverSaturated = (pool: StakePool, additionalStake?: string) =>
    new BigNumber(pool.live_stake)
        .plus(additionalStake ?? '0')
        .div(pool.saturation)
        .toNumber() > 0.8;

export const getStakePoolForDelegation = (trezorPools: PoolsResponse, accountBalance: string) => {
    let pool = trezorPools.next;
    if (isPoolOverSaturated(pool, accountBalance)) {
        // eslint-disable-next-line prefer-destructuring
        pool = trezorPools.pools[0];
    }
    return pool;
};
// Type guard to differentiate between PrecomposedTransactionFinal and PrecomposedTransactionFinalCardano
export const isCardanoTx = (
    account: Account,
    _tx: PrecomposedTransactionFinalCardano | PrecomposedTransactionFinal,
): _tx is PrecomposedTransactionFinalCardano => account.networkType === 'cardano';

export const isCardanoExternalOutput = (
    output: CardanoOutput,
): output is Extract<CardanoOutput, 'address'> => 'address' in output;

export const formatMaxOutputAmount = (
    maxAmount: string | undefined,
    maxOutput: ReturnType<typeof transformUserOutputs>[number] | undefined,
    account: Account,
) => {
    // Converts 'max' amount returned from coinselection in lovelaces (or token equivalent) to ADA (or token unit)
    if (!maxOutput || !maxAmount) return maxAmount;
    if (maxOutput.assets.length === 0) {
        // output without asset, convert lovelaces to ADA
        return formatNetworkAmount(maxAmount, account.symbol);
    }

    // output with a token, format using token decimals
    const tokenDecimals =
        account.tokens?.find(t => t.contract === maxOutput.assets[0].unit)?.decimals ?? 0;

    return formatAmount(maxAmount, tokenDecimals);
};
