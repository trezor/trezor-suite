import { type SelectedAccountRootState, selectSelectedAccount } from '@suite/account';
import { type LocksRootState, selectIsDeviceOrUiLocked } from '@suite/locks';
import { type ModalRootState } from '@suite/modal';
import { type RouterRootState } from '@suite/router';
import { type TorRootState, selectTorState } from '@suite/tor';
import { type DeviceRootState, selectDeviceStatus } from '@suite-common/device';
import {
    Feature,
    type MessageSystemRootState,
    selectFeatureConfig,
    selectIsFeatureDisabled,
} from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    type BlockchainRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getInputSize, getOutputSize } from '@trezor/coinjoin';
import { BigNumber } from '@trezor/utils';

import { type CoinjoinState } from './coinjoinTypes';
import {
    breakdownCoinjoinBalance,
    calculateAnonymityProgress,
    calculateAverageAnonymityGainPerRound,
    cleanAnonymityGains,
    getMaxFeePerVbyte,
    getMaxRounds,
    getSkipRounds,
} from './coinjoinUtils';
import {
    CLIENT_STATUS_FALLBACK,
    DEFAULT_TARGET_ANONYMITY,
    FEE_RATE_MEDIAN_FALLBACK,
    MIN_ANONYMITY_GAINED_PER_ROUND,
    SKIP_ROUNDS_BY_DEFAULT,
    UNECONOMICAL_COINJOIN_THRESHOLD,
    ZKSNACKS_LEGAL_DOCUMENTS_VERSION,
} from './config';

export type CoinjoinRootState = {
    wallet: {
        coinjoin: CoinjoinState;
    };
    // slim slice of the suite reducer; declared locally to avoid a dependency on the suite app
    suite: {
        online: boolean;
    };
} & AccountsRootState &
    BlockchainRootState &
    TransactionsRootState &
    WalletSettingsRootState &
    SelectedAccountRootState &
    DeviceRootState &
    RouterRootState &
    ModalRootState &
    TorRootState &
    MessageSystemRootState &
    LocksRootState;

export type GetState = () => CoinjoinRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<CoinjoinRootState>();

export const selectCoinjoinAccounts = (state: CoinjoinRootState) => state.wallet.coinjoin.accounts;

export const selectCoinjoinIsPreloading = (state: CoinjoinRootState) =>
    state.wallet.coinjoin.isPreloading;

export const selectCoinjoinClients = (state: CoinjoinRootState) => state.wallet.coinjoin.clients;

export const selectRoundsDurationInHours = (state: CoinjoinRootState) =>
    state.wallet.coinjoin.config.roundsDurationInHours;

export const selectRoundsFailRateBuffer = (state: CoinjoinRootState) =>
    state.wallet.coinjoin.config.roundsFailRateBuffer;

export const selectMaxMiningFeeModifier = (state: CoinjoinRootState) =>
    state.wallet.coinjoin.config.maxMiningFeeModifier;

export const selectMaxMiningFeeConfig = (state: CoinjoinRootState) =>
    state.wallet.coinjoin.config.maxFeePerVbyte;

export const selectCoinjoinAccountByKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey | null,
) => {
    const coinjoinAccounts = selectCoinjoinAccounts(state);

    return coinjoinAccounts.find(account => account.key === accountKey);
};

export const selectCoinjoinClient = (state: CoinjoinRootState, accountKey: AccountKey | null) => {
    const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
    const clients = selectCoinjoinClients(state);

    return coinjoinAccount?.symbol && clients[coinjoinAccount?.symbol];
};

export const selectSessionByAccountKey = (state: CoinjoinRootState, accountKey: AccountKey) => {
    const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);

    return coinjoinAccount?.session;
};

export const selectTargetAnonymityByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey | null,
) => {
    const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
    if (!coinjoinAccount) return;

    return coinjoinAccount.setup?.targetAnonymity ?? DEFAULT_TARGET_ANONYMITY;
};

export const selectCurrentCoinjoinBalanceBreakdown = (state: CoinjoinRootState) => {
    const selectedAccount = selectSelectedAccount(state);
    const targetAnonymity = selectedAccount
        ? selectTargetAnonymityByAccountKey(state, selectedAccount.key)
        : undefined;

    const { addresses, utxo: utxos } = selectedAccount || {};

    const balanceBreakdown = breakdownCoinjoinBalance({
        targetAnonymity,
        anonymitySet: addresses?.anonymitySet,
        utxos,
    });

    return balanceBreakdown;
};

export const selectRegisteredUtxosByAccountKey = createMemoizedSelector(
    [selectCoinjoinAccountByKey],
    coinjoinAccount => {
        if (!coinjoinAccount?.prison) return;
        const { prison, session, transactionCandidates } = coinjoinAccount;

        return Object.keys(prison).reduce<typeof prison>((result, key) => {
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const inmate: (typeof prison)[string] = prison[key];
            // select **only** inmates with assigned roundId (signed in current round or promised to future blaming round)
            if (
                inmate.roundId &&
                (session || transactionCandidates?.some(tx => tx.roundId === inmate.roundId))
            ) {
                result[key] = inmate;
            }

            return result;
        }, {});
    },
);

export const selectSessionProgressByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey | null,
) => {
    const relatedAccount = selectAccountByKey(state, accountKey);
    const targetAnonymity = selectTargetAnonymityByAccountKey(state, accountKey);

    const { addresses, balance, utxo: utxos } = relatedAccount || {};

    if (!balance || !utxos) {
        return 0;
    }

    const progress = calculateAnonymityProgress({
        targetAnonymity,
        anonymitySet: addresses?.anonymitySet,
        utxos,
    });

    return progress;
};

export const selectCurrentCoinjoinSession = (state: CoinjoinRootState) => {
    const selectedAccount = selectSelectedAccount(state);
    const coinjoinAccounts = selectCoinjoinAccounts(state);

    const currentCoinjoinAccount = coinjoinAccounts.find(
        account => account.key === selectedAccount?.key,
    );

    const { session } = currentCoinjoinAccount || {};

    return session;
};

export const selectCurrentTargetAnonymity = (state: CoinjoinRootState) => {
    const selectedAccount = selectSelectedAccount(state);
    const targetAnonymity = selectedAccount
        ? selectTargetAnonymityByAccountKey(state, selectedAccount.key)
        : undefined;

    return targetAnonymity;
};

const isRoundPhaseCritical = (roundPhase?: number) => (roundPhase ?? 0) > 0;

export const selectIsAnySessionInCriticalPhase = (state: CoinjoinRootState) => {
    const coinjoinAccounts = selectCoinjoinAccounts(state);

    return coinjoinAccounts.some(acc => isRoundPhaseCritical(acc.session?.roundPhase));
};

export const selectIsAccountWithSessionInCriticalPhaseByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);

    return isRoundPhaseCritical(coinjoinAccount?.session?.roundPhase);
};

export const selectIsAccountWithSessionByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const coinjoinAccounts = selectCoinjoinAccounts(state);

    return coinjoinAccounts.find(a => a.key === accountKey && a.session && !a.session.paused);
};

export const selectFeeRateMedianByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const coinjoinClient = selectCoinjoinClient(state, accountKey);

    return coinjoinClient?.feeRateMedian || FEE_RATE_MEDIAN_FALLBACK;
};

export const selectDefaultMaxMiningFeeByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const feeRateMedian = selectFeeRateMedianByAccountKey(state, accountKey);
    const maxMiningFeeModifier = selectMaxMiningFeeModifier(state);
    const maxMiningFeeConfig = selectMaxMiningFeeConfig(state); // value defined in message system config has priority over default value (but not over custom value set by user)

    return maxMiningFeeConfig ?? getMaxFeePerVbyte(feeRateMedian, maxMiningFeeModifier);
};

export const selectMinAllowedInputWithFee = (state: CoinjoinRootState, accountKey: AccountKey) => {
    const coinjoinClient = selectCoinjoinClient(state, accountKey);
    const status = coinjoinClient || CLIENT_STATUS_FALLBACK;
    const minAllowedInput = status.allowedInputAmounts.min;
    const txSize = getInputSize('Taproot') + getOutputSize('Taproot');

    // Add estimated fee based on weekly median fee rate.
    return minAllowedInput + txSize * status.feeRateMedian;
};

export const selectIsNothingToAnonymizeByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const minAllowedInputWithFee = selectMinAllowedInputWithFee(state, accountKey);
    const account = selectAccountByKey(state, accountKey);
    const targetAnonymity =
        selectTargetAnonymityByAccountKey(state, accountKey) ?? DEFAULT_TARGET_ANONYMITY;

    const anonymitySet = account?.addresses?.anonymitySet || {};
    const utxos = account?.utxo || [];

    // Return true if all non-private funds are too small.
    return utxos
        .filter(utxo => (anonymitySet[utxo.address] ?? 1) < targetAnonymity)
        .every(utxo => new BigNumber(utxo.amount).lt(minAllowedInputWithFee));
};

export const selectWeightedAnonymityByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const account = selectAccountByKey(state, accountKey);
    const targetAnonymity =
        selectTargetAnonymityByAccountKey(state, accountKey) ?? DEFAULT_TARGET_ANONYMITY;

    const anonymitySet = account?.addresses?.anonymitySet || {};
    const utxos = account?.utxo || [];
    const weightedAnonymitySum = BigNumber.sum(
        0,
        ...utxos.map(utxo =>
            new BigNumber(utxo.amount).times(
                Math.min(targetAnonymity, anonymitySet[utxo.address] || 1),
            ),
        ),
    );
    const amountsSum = BigNumber.sum(0, ...utxos.map(utxo => utxo.amount));

    return amountsSum.isZero() ? 1 : weightedAnonymitySum.div(amountsSum).toNumber();
};

export const selectRoundsNeededByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
    const targetAnonymity =
        selectTargetAnonymityByAccountKey(state, accountKey) ?? DEFAULT_TARGET_ANONYMITY;
    const weightedAnonymity = selectWeightedAnonymityByAccountKey(state, accountKey);
    const defaultAnonymityGainPerRound = state.wallet.coinjoin.config.averageAnonymityGainPerRound;

    const averageAnonymityGainPerRound = calculateAverageAnonymityGainPerRound(
        defaultAnonymityGainPerRound,
        coinjoinAccount?.anonymityGains?.history,
    );

    return Math.ceil(
        (targetAnonymity - weightedAnonymity) /
            Math.max(averageAnonymityGainPerRound, MIN_ANONYMITY_GAINED_PER_ROUND),
    );
};

export const selectAnonymityGainToReportByAccountKey = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
    const lastReport = coinjoinAccount?.anonymityGains?.lastReportTimestamp;

    if (!coinjoinAccount?.anonymityGains) {
        return null;
    }

    const anonymityGains = cleanAnonymityGains(coinjoinAccount.anonymityGains.history);

    // Report only results not reported before.
    const gainsToReport = lastReport
        ? anonymityGains.filter(level => level.timestamp > lastReport)
        : anonymityGains;

    if (!gainsToReport.length) {
        return null;
    }

    // Report average value. Reporting values per round would compromise data privacy.
    const average =
        gainsToReport.reduce((total, current) => total + current.level, 0) / gainsToReport.length;

    return parseFloat(average.toFixed(3));
};

export const selectRoundsLeftByAccountKey = (state: CoinjoinRootState, accountKey: AccountKey) => {
    const coinjoinSession = selectSessionByAccountKey(state, accountKey);

    if (!coinjoinSession) {
        return 0;
    }

    const { maxRounds, signedRounds } = coinjoinSession;

    return maxRounds - signedRounds.length;
};

export const selectHasAnonymitySetError = (state: CoinjoinRootState) => {
    const selectedAccount = selectSelectedAccount(state);

    if (!selectedAccount) {
        return false;
    }

    const { addresses, utxo: utxos } = selectedAccount;

    const hasFaultyAnonymitySet = !utxos?.every(
        ({ address }) => addresses?.anonymitySet?.[address] !== undefined,
    );

    return hasFaultyAnonymitySet;
};

export const selectCoinjoinSessionBlockerByAccountKey = (
    state: CoinjoinRootState & DeviceRootState & LocksRootState,
    accountKey: AccountKey | null,
) => {
    if (accountKey === null) {
        return;
    }

    if (selectSessionByAccountKey(state, accountKey)?.starting) {
        return 'SESSION_STARTING';
    }
    if (selectIsFeatureDisabled(state, Feature.coinjoin)) {
        return 'FEATURE_DISABLED';
    }
    if (selectCoinjoinClient(state, accountKey)?.status === 'unavailable') {
        return 'COORDINATOR_UNAVAILABLE';
    }
    if (!state.suite.online) {
        return 'OFFLINE';
    }
    if (selectIsNothingToAnonymizeByAccountKey(state, accountKey)) {
        return 'NOTHING_TO_ANONYMIZE';
    }
    if (!selectTorState(state).isTorEnabled) {
        return 'TOR_DISABLED';
    }
    if (!['connected', 'firmware-recommended'].includes(selectDeviceStatus(state) ?? '')) {
        return 'DEVICE_DISCONNECTED';
    }
    const account = selectAccountByKey(state, accountKey);
    if (account?.backendType === 'coinjoin' && account?.status === 'out-of-sync') {
        return 'ACCOUNT_OUT_OF_SYNC';
    }
    if (selectIsDeviceOrUiLocked(state)) {
        return 'DEVICE_LOCKED';
    }
    if (selectHasAnonymitySetError(state)) {
        return 'ANONYMITY_ERROR';
    }
};

export const selectCurrentCoinjoinWheelStates = (state: CoinjoinRootState & DeviceRootState) => {
    const { notAnonymized } = selectCurrentCoinjoinBalanceBreakdown(state);
    const { key, balance } = selectSelectedAccount(state) || {};
    const coinjoinAccount = selectCoinjoinAccountByKey(state, key || null);
    const coinjoinClient = selectCoinjoinClient(state, key || null);
    const sessionProgress = selectSessionProgressByAccountKey(state, key || null);

    const coinjoinSessionBlocker = selectCoinjoinSessionBlockerByAccountKey(state, key || null);

    const { paused } = coinjoinAccount?.session || {};

    // session states
    const isSessionActive = !!coinjoinAccount?.session;
    const isPaused = !!paused;
    const isLoading = coinjoinSessionBlocker === 'SESSION_STARTING';
    const isAutoStopEnabled = coinjoinAccount?.session?.isAutoStopEnabled;
    const isCriticalPhase = isRoundPhaseCritical(coinjoinAccount?.session?.roundPhase);

    // account states
    const isAccountEmpty = !balance || balance === '0';
    const isNonePrivate = sessionProgress === 0;
    const isAllPrivate = notAnonymized === '0';
    const isCoinjoinUneco = !!balance && new BigNumber(balance).lt(UNECONOMICAL_COINJOIN_THRESHOLD);

    const agreedToLegalDocumentVersions = coinjoinAccount?.agreedToLegalDocumentVersions;
    const latestTezorLegalDocumentVersion = state.wallet.coinjoin.config.legalDocumentsVersion;
    const latestZkSNACKsLegalDocumentVersion =
        coinjoinClient?.version?.legalDocumentsVersion ?? ZKSNACKS_LEGAL_DOCUMENTS_VERSION;

    const isLegalDocumentConfirmed =
        agreedToLegalDocumentVersions?.zkSNACKs === latestZkSNACKsLegalDocumentVersion &&
        agreedToLegalDocumentVersions.trezor === latestTezorLegalDocumentVersion;

    // error state
    const isResumeBlockedByLastingIssue =
        !!coinjoinSessionBlocker &&
        !['DEVICE_LOCKED', 'SESSION_STARTING'].includes(coinjoinSessionBlocker);

    return {
        isSessionActive,
        isPaused,
        isLoading,
        isAutoStopEnabled,
        isCriticalPhase,
        isAccountEmpty,
        isNonePrivate,
        isAllPrivate,
        isResumeBlockedByLastingIssue,
        isCoinjoinUneco,
        isLegalDocumentConfirmed,
    };
};

// return tuple of arguments used by startCoinjoinSession action
export const selectStartCoinjoinSessionArguments = (
    state: CoinjoinRootState,
    accountKey: AccountKey,
) => {
    const selectedAccount = selectSelectedAccount(state);
    const coinjoinAccount = selectCoinjoinAccountByKey(state, accountKey);
    const coinjoinClient = selectCoinjoinClient(state, accountKey);
    const roundsNeeded = selectRoundsNeededByAccountKey(state, accountKey);
    const roundsFailRateBuffer = selectRoundsFailRateBuffer(state);
    const defaultMaxMiningFee = selectDefaultMaxMiningFeeByAccountKey(state, accountKey);
    const targetAnonymity =
        selectTargetAnonymityByAccountKey(state, accountKey) ?? DEFAULT_TARGET_ANONYMITY;

    if (!selectedAccount || !coinjoinAccount || !coinjoinClient) return;

    const maxFeePerKvbyte = (coinjoinAccount.setup?.maxFeePerVbyte ?? defaultMaxMiningFee) * 1000; // Transform to kvB.
    const maxRounds = getMaxRounds(roundsNeeded, roundsFailRateBuffer);
    const skipRounds = getSkipRounds(
        coinjoinAccount.setup ? coinjoinAccount.setup.skipRounds : SKIP_ROUNDS_BY_DEFAULT,
    );

    return [
        selectedAccount,
        {
            maxCoordinatorFeeRate: Math.min(coinjoinClient.coordinationFeeRate.rate, 0.01), // 1% max cap by suite
            maxFeePerKvbyte,
            maxRounds,
            skipRounds,
            targetAnonymity,
        },
    ] as const;
};

export const selectCurrentSessionDeadlineInfo = (state: CoinjoinRootState) => {
    const session = selectCurrentCoinjoinSession(state);

    const { roundPhase, roundPhaseDeadline, sessionDeadline } = session || {};

    return {
        roundPhase,
        roundPhaseDeadline,
        sessionDeadline,
    };
};

// Return true if it's not explicitly set to false in the message-system config.
export const selectIsPublic = (state: CoinjoinRootState) =>
    selectFeatureConfig(state, Feature.coinjoin)?.isPublic !== false;

export const selectIsSessionAutostopped = (state: CoinjoinRootState, accountKey: AccountKey) => {
    const currentState = selectSessionByAccountKey(state, accountKey);

    return !!currentState?.isAutoStopEnabled;
};
