import {
    type Account,
    type Output,
    type PrecomposedTransactionFinal,
    type PrecomposedTransactionFinalCardano,
} from '@suite-common/wallet-types';
import { type CardanoCertificate, PROTO } from '@trezor/connect';
import {
    formatMaxOutputAmount as formatCardanoMaxOutputAmount,
    getAddressParameters,
    getAddressType,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
    getUnusedChangeAddress,
    transformUserOutputs as transformCardanoUserOutputs,
} from '@trezor/network-cardano-suite-common';

import { getAccountDecimals } from './amountUtils';

export {
    getAddressParameters,
    getAddressType,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getStakingPath,
    getUnusedChangeAddress,
};

/** The send form's outputs as Cardano composing takes them. */
export const transformUserOutputs = (
    outputs: Output[],
    accountTokens: Account['tokens'],
    symbol: Account['symbol'],
    maxOutputIndex?: number,
) =>
    transformCardanoUserOutputs(
        outputs,
        accountTokens,
        getAccountDecimals(symbol) ?? 0,
        maxOutputIndex,
    );

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
) =>
    formatCardanoMaxOutputAmount(
        maxAmount,
        maxOutput,
        account,
        getAccountDecimals(account.symbol) ?? 0,
    );

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
