import { Account } from '../Account';
import { Alice } from '../Alice';
import { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';
import { CoinjoinPrison } from '../CoinjoinPrison';
import * as middleware from '../middleware';
import { RoundPhase, Round } from '../../types/coordinator';

const getRoundCandidates = (
    statusRounds: Round[],
    currentRounds: CoinjoinRound[],
    options: CoinjoinRoundOptions,
) => {
    const now = Date.now();
    return statusRounds
        .filter(
            round =>
                round.phase === RoundPhase.InputRegistration &&
                // !currentRounds.find(r => r.id === round.id) &&
                new Date(round.inputRegistrationEnd).getTime() - now > 30000, // TODO: do not register in last minute
        )
        .flatMap(round => {
            const current = currentRounds.find(r => r.id === round.id);
            if (current) return current;
            // try to create new CoinjoinRound
            try {
                return new CoinjoinRound(round, options);
            } catch (e) {
                return [];
            }
        });
};

const getAccountCandidates = (
    accounts: Account[],
    _statusRounds: Round[],
    currentRounds: CoinjoinRound[],
    prison: CoinjoinPrison,
) => {
    // TODO: lookup statusrounds for registered inputs and if they are in phase 0 or 1, try to restore them otherwise put them to prison
    // TODO: lookup statusrounds for registered outputs and exclude them from account, put them to prison
    const registeredOutpoints = currentRounds
        .flatMap(active => active.inputs.map(u => u.outpoint) || active.failed.map(u => u.outpoint))
        .concat(prison.inmates.map(i => i.id));
    // TODO: walk thru all Round[] and search registered details in round events by input/output scriptPubKey
    return accounts.flatMap(account => {
        // // TODO: confirmations, randomized, limit inputs in one round etc.
        const isAccountAlreadyRegistered = currentRounds.find(
            round =>
                round.phase !== RoundPhase.Ended &&
                round.inputs.find(input => input.accountKey === account.accountKey),
        );

        // const accountRoundLimit = account.maxRounds - account.currentRound;
        // console.warn('ACC ROUND LIMIT', accountRoundLimit, account.maxRounds, account.currentRound);
        // if (accountRoundLimit < 1) return result;

        // TODO: tmp try max 10 per round
        const utxos = account.utxos.filter(utxo => !registeredOutpoints.includes(utxo.outpoint));
        if (!isAccountAlreadyRegistered && utxos.length > 0) {
            return {
                ...account,
                utxos,
            };
        }
        return [];
    });
};

const selectUtxoForRound = async (
    roundCandidates: CoinjoinRound[],
    accountCandidates: ReturnType<typeof getAccountCandidates>,
    options: CoinjoinRoundOptions,
) => {
    // result shape: array_of_rounds contains array_of_accounts contains array_of_account_suitable_utxo_indexes
    // example 2 rounds with 3 accounts: [[[], [], [0, 1, 2]], [[3], [], [0, 1, 2]]]
    const utxoSelection = await Promise.all(
        roundCandidates.map(round => {
            const { roundParameters } = round;
            const roundConstants = {
                miningFeeRate: roundParameters.miningFeeRate,
                coordinationFeeRate: roundParameters.coordinationFeeRate,
                allowedInputAmounts: roundParameters.allowedInputAmounts,
                allowedOutputAmounts: roundParameters.allowedOutputAmounts,
                allowedInputTypes: roundParameters.allowedInputScriptTypes,
            };

            return Promise.all(
                accountCandidates.map(account => {
                    const utxos = account.utxos.map(utxo => ({
                        outpoint: utxo.outpoint,
                        amount: utxo.amount,
                        scriptType: account.scriptType,
                        anonymitySet: utxo.anonymityLevel,
                    }));
                    return middleware
                        .selectUtxoForRound(roundConstants, utxos, 50, {
                            signal: options.signal,
                            baseUrl: options.middlewareUrl,
                        })
                        .catch(() => [] as number[]); // return empty response on error, TODO: some manual fallback?
                }),
            );
        }),
    );

    // find Round with maximum possible utxos
    const sumUtxosInRounds = utxoSelection.map(acc => acc.reduce((a, b) => a + b.length, 0));
    const maxUtxosInRound = Math.max(...sumUtxosInRounds);
    if (maxUtxosInRound < 1) {
        return;
    }

    // get index of Round with maximum possible utxos
    const roundIndex = sumUtxosInRounds.findIndex(count => count === maxUtxosInRound);
    const selectedRound = roundCandidates[roundIndex];

    // setup new Round
    accountCandidates.forEach((account, accountIndex) => {
        // find selected
        const utxoIndexes = utxoSelection[roundIndex][accountIndex];
        const selectedUtxos = utxoIndexes.map(utxoIndex => account.utxos[utxoIndex]).filter(u => u);
        if (selectedUtxos.length > 0) {
            selectedRound.inputs.push(
                ...selectedUtxos.map(
                    utxo => new Alice(account.accountKey, account.scriptType, utxo),
                ),
            );
        }
    });

    return selectedRound;
};

export const selectRound = async (
    accounts: Account[],
    statusRounds: Round[],
    currentRounds: CoinjoinRound[],
    prison: CoinjoinPrison,
    options: CoinjoinRoundOptions,
): Promise<CoinjoinRound | void> => {
    const { log } = options;

    log(`Looking for rounds.`);
    const roundCandidates = getRoundCandidates(statusRounds, currentRounds, options);
    if (roundCandidates.length < 1) {
        log('No suitable rounds');
        return;
    }

    log(`Looking for accounts. Candidates: ${accounts.map(a => a.accountKey).join(',')}`);
    const accountCandidates = getAccountCandidates(accounts, statusRounds, currentRounds, prison);

    if (accountCandidates.length < 1) {
        log('No suitable accounts');
        return;
    }

    log(
        `Looking for suitable utxos. Candidates: ${accountCandidates
            .map(a => a.utxos.map(u => u.outpoint))
            .join(',')}`,
    );
    const newRound = await selectUtxoForRound(roundCandidates, accountCandidates, options);
    if (!newRound) {
        log('No suitable utxos');
        return;
    }

    log(`New round created: ${newRound.id}`);
    return newRound;
};
