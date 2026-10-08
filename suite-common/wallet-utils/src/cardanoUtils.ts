import { type AccountType, type NetworkSymbol } from '@suite-common/wallet-config';
import { MIN_CARDANO_AMOUNT_FOR_SEND } from '@suite-common/wallet-constants';
import {
    type Account,
    type GeneralPrecomposedTransaction,
    type Output,
    type PrecomposedTransactionFinal,
    type PrecomposedTransactionFinalCardano,
} from '@suite-common/wallet-types';
import { CARDANO, type CardanoCertificate, PROTO } from '@trezor/connect';
import { BigNumber } from '@trezor/utils';

import { type AmountSubunit, asAmountSubunit, asAmountUnit } from './AmountTypes';
import {
    convertAmountSubunitsToUnits,
    convertAmountUnitsToSubunits,
    formatNetworkAmount,
    networkAmountToSmallestUnit,
    unitsToSubunits,
} from './amountUtils';

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

export const getStakingPath = (account: Pick<Account, 'index'>) =>
    `m/1852'/1815'/${account.index}'/2/0`;

export const getProtocolMagic = (accountSymbol: Account['symbol']) =>
    // TODO: use testnet magic from connect once this PR is merged https://github.com/trezor/connect/pull/1046
    accountSymbol === 'ada' ? CARDANO.PROTOCOL_MAGICS.mainnet : 1097911063;

export const getAddressType = () => PROTO.CardanoAddressType.BASE;

export const getNetworkId = () => CARDANO.NETWORK_IDS.mainnet;

export const getAddressParameters = (account: Pick<Account, 'index'>, path: string) => ({
    path,
    addressType: getAddressType(),
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
            output.amount === '' ? undefined : networkAmountToSmallestUnit(output.amount, symbol);
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

export const getShortFingerprint = (fingerprint: string) => {
    const firstPart = fingerprint.substring(0, 10);
    const lastPart = fingerprint.substring(fingerprint.length - 10);

    return `${firstPart}…${lastPart}`;
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

export const getVotingCertificates = (
    stakingPath: string,
    dRep: { hex?: string; type: PROTO.CardanoDRepType },
) => {
    const result: CardanoCertificate[] = [
        {
            type: PROTO.CardanoCertificateType.VOTE_DELEGATION,
            path: stakingPath,
            dRep: {
                keyHash: dRep.type === PROTO.CardanoDRepType.KEY_HASH ? dRep.hex : undefined,
                scriptHash: dRep.type === PROTO.CardanoDRepType.SCRIPT_HASH ? dRep.hex : undefined,
                type: dRep.type,
            },
        },
    ];

    return result;
};

// Type guard to differentiate between PrecomposedTransactionFinal and PrecomposedTransactionFinalCardano
export const isCardanoTx = (
    account: Account,
    _tx: PrecomposedTransactionFinalCardano | PrecomposedTransactionFinal,
): _tx is PrecomposedTransactionFinalCardano => account.networkType === 'cardano';

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

    const { assets } = maxOutput;
    // @ts-expect-error: indexing with noUncheckedIndexedAccess
    const firstAsset: (typeof assets)[number] = assets[0];
    // output with a token, format using token decimals
    const tokenDecimals = account.tokens?.find(t => t.contract === firstAsset.unit)?.decimals ?? 0;

    return convertAmountSubunitsToUnits(maxAmount, tokenDecimals);
};

export const getCardanoFingerprint = (
    tokens: Account['tokens'],
    symbol: string | undefined,
): string | undefined => {
    if (!tokens) {
        return undefined;
    }

    const token = tokens.find(t => t.symbol?.toLowerCase() === symbol?.toLowerCase());

    return token?.fingerprint;
};

type GetCardanoTokenSendMinAdaAmountParams = {
    symbol: NetworkSymbol;
    outputs: Pick<Output, 'token' | 'amount'>[];
    composedFeeLevel?: GeneralPrecomposedTransaction;
};

export const getCardanoTokenSendMinAdaAmount = ({
    symbol,
    outputs,
    composedFeeLevel,
}: GetCardanoTokenSendMinAdaAmountParams): AmountSubunit => {
    if (composedFeeLevel && composedFeeLevel.type !== 'error') {
        return asAmountSubunit(new BigNumber(composedFeeLevel.totalSpent));
    }

    const adaOutputsAmount = outputs.reduce(
        (acc, output) => (!output.token && output.amount ? acc.plus(output.amount) : acc),
        new BigNumber(0),
    );

    return asAmountSubunit(
        MIN_CARDANO_AMOUNT_FOR_SEND.times(outputs.length).plus(
            unitsToSubunits({ symbol, value: asAmountUnit(adaOutputsAmount) }),
        ),
    );
};

type IsCardanoTokenSendAdaInsufficientParams = {
    balance: string;
    minAdaAmount: AmountSubunit;
};

export const isCardanoTokenSendAdaInsufficient = ({
    balance,
    minAdaAmount,
}: IsCardanoTokenSendAdaInsufficientParams): boolean => new BigNumber(balance).lt(minAdaAmount);
