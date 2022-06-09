import * as middleware from '../middleware';
import { getEvents, getCommitmentData } from '../clientUtils';
import { RegisteredAccount, Round, RoundPhase, ActiveRound, ActiveRoundOptions } from '../../types';

type RoundCandidate = Omit<ActiveRound, 'accounts' | 'commitmentData'>;

const getRoundCandidates = (rounds: Round[], activeRounds: ActiveRound[]): RoundCandidate[] => {
    const now = Date.now();
    return rounds
        .filter(
            round =>
                round.phase === RoundPhase.InputRegistration &&
                !activeRounds.find(r => r.id === round.id) &&
                new Date(round.inputRegistrationEnd).getTime() - now > 30000, // TODO: do not register in last minute
        )
        .flatMap(round => {
            const [event] = getEvents('RoundCreated', round.coinjoinState.events);
            if (!event) {
                return [];
            }
            return {
                id: round.id,
                phase: round.phase,
                amountCredentialIssuerParameters: round.amountCredentialIssuerParameters,
                vsizeCredentialIssuerParameters: round.vsizeCredentialIssuerParameters,
                roundParameters: {
                    ...event.roundParameters,
                    inputRegistrationEnd: round.inputRegistrationEnd,
                },
                coinjoinState: round.coinjoinState,
            };
        });
};

const getAccountCandidates = (
    accounts: RegisteredAccount[],
    _rounds: Round[],
    activeRounds: ActiveRound[],
) => {
    const registeredOutpoints = activeRounds.flatMap(active =>
        Object.values(active.accounts).flatMap(account => account.utxos.map(u => u.outpoint)),
    );
    // TODO: walk thru all Round[] and search registered details in round events by input/output scriptPubKey
    return accounts.flatMap(account => {
        // // TODO: confirmations, randomized, limit inputs in one round etc.
        const isAccountAlreadyRegistered = activeRounds.find(
            round =>
                round.phase !== RoundPhase.Ended &&
                Object.keys(round.accounts).includes(account.descriptor),
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
    rounds: RoundCandidate[],
    accounts: RegisteredAccount[],
    options: ActiveRoundOptions,
) => {
    // result shape: array_of_rounds contains array_of_accounts contains array_of_account_suitable_utxo_indexes
    // example 2 rounds with 3 accounts: [[[], [], [0, 1, 2]], [[3], [], [0, 1, 2]]]
    const result = await Promise.all(
        rounds.map(round => {
            const { roundParameters } = round;
            const roundConstants = {
                miningFeeRate: roundParameters.miningFeeRate,
                coordinationFeeRate: roundParameters.coordinationFeeRate,
                allowedInputAmounts: roundParameters.allowedInputAmounts,
                allowedOutputAmounts: roundParameters.allowedOutputAmounts,
                allowedInputTypes: roundParameters.allowedInputScriptTypes,
            };

            return Promise.all(
                accounts.map(account => {
                    const utxos = account.utxos.map(utxo => ({
                        outpoint: utxo.outpoint,
                        amount: utxo.amount,
                        scriptType: account.type,
                        anonymitySet: account.anonymityLevel,
                    }));
                    return middleware
                        .selectUtxoForRound(roundConstants, utxos, 50, {
                            signal: options.signal,
                            baseUrl: options.middlewareUrl,
                        })
                        .catch(() => [] as number[]); // return empty response on error
                }),
            );
        }),
    );

    // find round with max possible utxos
    const utxoCountByRound = result.map(acc => acc.reduce((a, b) => a + b.length, 0));
    const maxUtxoCountInRound = Math.max(...utxoCountByRound);
    if (maxUtxoCountInRound < 1) {
        return;
    }

    const roundIndex = utxoCountByRound.findIndex(count => count === maxUtxoCountInRound);
    const accountsForRound: ActiveRound['accounts'] = {};
    accounts.forEach((account, index) => {
        const aaa = result[roundIndex][index];
        const utxos = aaa.map(i => account.utxos[i]);
        if (utxos.length > 0) {
            accountsForRound[account.descriptor] = {
                type: account.type,
                addresses: account.addresses,
                utxos,
            };
        }
    });

    return {
        ...rounds[roundIndex],
        accounts: accountsForRound,
    };
};

export const selectRound = async (
    accounts: RegisteredAccount[],
    rounds: Round[],
    activeRounds: ActiveRound[],
    options: ActiveRoundOptions,
): Promise<ActiveRound | void> => {
    const { coordinatorName, log } = options;
    log('Looking for new rounds');
    const roundCandidates = getRoundCandidates(rounds, activeRounds);
    if (roundCandidates.length < 1) {
        log('No suitable rounds');
        return;
    }

    log('Looking for accounts');
    const accountCandidates = getAccountCandidates(accounts, rounds, activeRounds);
    if (accountCandidates.length < 1) {
        log('No available accounts');
        return;
    }

    log('Looking for available utxos');
    const newRound = await selectUtxoForRound(roundCandidates, accountCandidates, options);
    if (!newRound) {
        log('No available utxos');
        return;
    }

    log(`Trying to register to round ${newRound.id}`);
    return {
        ...newRound,
        commitmentData: getCommitmentData(coordinatorName, newRound.id),
    };
};
