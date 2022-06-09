import { inputRegistration } from './inputRegistration';
import { connectionConfirmation } from './connectionConfirmation';
import { outputRegistration } from './outputRegistration';
import { transactionSigning } from './transactionSigning';
import { getRequests } from './walletRequests';
import { updateAccountsUtxos } from '../clientUtils';
import { ActiveRound, ActiveRoundOptions, RegisteredAccount, RoundPhase, Round } from '../../types';

const lockRound = (round: string, signal: AbortSignal) => {
    const abort = new AbortController();
    let localResolve: () => void = () => {};
    let localReject: (e?: Error) => void = () => {};

    const promise: Promise<void> = new Promise((resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
    });

    signal.addEventListener('abort', () => {
        abort.abort();
    });

    return {
        round,
        resolve: localResolve,
        reject: localReject,
        promise,
        abort,
    };
};

const locks: ReturnType<typeof lockRound>[] = [];

// Function used for interruption of currently running process.
// Usually it means that the Status was changed before process finish, so it is pointless to even try to continue.
// Not every step/phase is finished immediately, in some cases (inputRegistration, connectionConfirmation) post processing data from coordinator should not be interrupted.
export const finishCurrentProcess = (rounds: Round[]) => {
    const lockedRounds = locks.filter(locked => rounds.find(round => locked.round === round.id));
    if (lockedRounds.length > 0) {
        lockedRounds.forEach(l => {
            l.abort.abort();
        });
        return Promise.all(lockedRounds.map(l => l.promise));
    }
    return Promise.resolve();
};

const unlockCurrentProcess = (rounds: ActiveRound[]) => {
    // find locked rounds affected by the result and unlock them
    const unlock = rounds.flatMap(round => {
        const locked = locks.find(lock => lock.round === round.id);
        if (locked) {
            locked.resolve();
            return locked;
        }
        return [];
    });
    // find unresolved locks (not affected by the result)
    const unresolvedLocks = locks.filter(
        lock => !unlock.find(unlocked => unlocked.round === lock.round),
    );
    // reset all locks
    locks.splice(0);
    if (unresolvedLocks.length > 0) {
        // leave only unresolved
        locks.push(...unresolvedLocks);
    }
};

const postProcessResult = (rounds: ActiveRound[]) => {
    const failed: RegisteredAccount['utxos'] = [];
    const updateRounds = rounds.map(round => {
        // const accounts = Object.keys(round.accounts).reduce((result, key) => {
        //     const account = round.accounts[key];
        //     result[key] = {
        //         ...account,
        //         utxos: account.utxos.filter(utxo => {
        //             if (utxo.error) {
        //                 failed.push(utxo);
        //                 return false;
        //             }
        //             return true;
        //         }),
        //     };
        //     return result;
        // }, {} as ActiveRound['accounts']);

        const successfulUtxos = Object.values(round.accounts).flatMap(account =>
            account.utxos.filter(utxo => {
                if (utxo.error) {
                    failed.push(utxo);
                    return false;
                }
                return true;
            }),
        );

        // const utxos = round.utxos.filter(utxo => {
        //     if (utxo.error) {
        //         // failed.push(utxo);
        //         return false;
        //     }
        //     return true;
        // });
        return {
            ...round,
            accounts: updateAccountsUtxos(round.accounts, successfulUtxos),
        };
    });

    return {
        rounds: updateRounds,
        requests: getRequests(updateRounds),
        failed,
    };
};

// Function used for processing each changed ActiveRound depending on its phase
// Returns updated ActiveRound, the result is post processed and returned to caller (Client class)
export const processRounds = async (
    rounds: ActiveRound[],
    accounts: RegisteredAccount[],
    options: ActiveRoundOptions,
) => {
    const result = await Promise.all(
        rounds.map(round => {
            // create lock for each ActiveRound
            const processLock = lockRound(round.id, options.signal);
            const processOptions = { ...options, signal: processLock.abort.signal };
            locks.push(processLock);
            // try to run process on ActiveRound
            if (round.phase === RoundPhase.InputRegistration) {
                return inputRegistration(round, processOptions);
            }
            if (round.phase === RoundPhase.ConnectionConfirmation) {
                return connectionConfirmation(round, processOptions);
            }
            if (round.phase === RoundPhase.OutputRegistration) {
                return outputRegistration(round, accounts, processOptions);
            }
            if (round.phase === RoundPhase.TransactionSigning) {
                return transactionSigning(round, processOptions);
            }
            if (round.phase === RoundPhase.Ended) {
                return Promise.resolve(round);
            }
            return Promise.resolve(round);
        }),
    );

    const newState = postProcessResult(result);
    unlockCurrentProcess(result);

    return newState;
};
