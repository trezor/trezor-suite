import { getWeakRandomId, arrayShuffle } from '@trezor/utils';

import * as coordinator from '../coordinator';
import * as middleware from '../middleware';
import { outputDecomposition, Bob } from './outputDecomposition';
import type { Account } from '../Account';
import type { Alice } from '../Alice';
import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';
import { AccountAddress } from '../../types';
import { scheduleDelay } from '../../utils/roundUtils';
import { SessionPhase, WabiSabiProtocolErrorCode } from '../../enums';

/**
 * RoundPhase: 2, OutputRegistration
 *
 * Process steps:
 * - Calculate output amounts using middleware (see ./outputDecomposition)
 * - Combine registered Credentials in to outputs using coordinator /credential-issuance (see ./outputDecomposition)
 * - Register decomposed Credentials as outputs using coordinator /output-registration
 * - Finally call /ready-to-sign on coordinator for each input
 */

const registerOutput = async (
    round: CoinjoinRound,
    { accountKey, changeAddresses }: Account,
    { amountCredentials, vsizeCredentials }: Bob,
    assignedAddresses: AccountAddress[],
    options: CoinjoinRoundOptions,
) => {
    const { roundParameters, phaseDeadline } = round;
    const { signal, coordinatorUrl, middlewareUrl, logger } = options;

    const remainingTime = phaseDeadline - Date.now();
    const delay = scheduleDelay(Math.floor(remainingTime * 0.8));

    const outputAmountCredentials = await middleware.getRealCredentials(
        [], // NOTE: sending empty amountToRequest **will not** create credentialToRequest object which **should not** be sent to coordinator in output-registration request
        amountCredentials,
        round.amountCredentialIssuerParameters,
        roundParameters.MaxAmountCredentialValue,
        { signal, baseUrl: middlewareUrl },
    );
    const outputVsizeCredentials = await middleware.getRealCredentials(
        [],
        vsizeCredentials,
        round.vsizeCredentialIssuerParameters,
        roundParameters.MaxVsizeCredentialValue,
        { signal, baseUrl: middlewareUrl },
    );

    // TODO: tricky, if for some reason AlreadyRegisteredScript is called then we have 2 options:
    // - try again with different address and link my new address with old address (privacy loss against coordinator?)
    // - intentionally stop output registrations for all other credentials. Question: which input will be banned if i call readyToSign on each anyway? is it better to break here and not to proceed to signing?
    const tryToRegisterOutput = (useDelay = true): Promise<AccountAddress> => {
        const address = changeAddresses.find(
            a => !round.prison.isDetained(a.address) && !assignedAddresses.includes(a),
        );
        if (!address) {
            const detained = changeAddresses.filter(a => round.prison.isDetained(a.address));
            logger.error(
                `No change address available. Assigned in round: ${assignedAddresses.length}. Detained: ${detained.length}. Total: ${changeAddresses.length}`,
            );
            throw new Error('No change address available');
        }

        assignedAddresses.push(address);

        return coordinator
            .outputRegistration(
                round.id,
                address,
                outputAmountCredentials,
                outputVsizeCredentials,
                {
                    signal,
                    baseUrl: coordinatorUrl,
                    identity: getWeakRandomId(10),
                    delay: useDelay ? delay : 0, // do not use delay if registration is repeated
                    deadline: round.phaseDeadline,
                },
            )
            .then(() => address)
            .catch(error => {
                if (error instanceof coordinator.WabiSabiProtocolException) {
                    if (error.errorCode === WabiSabiProtocolErrorCode.AlreadyRegisteredScript) {
                        logger.error(`Change address already used (AlreadyRegisteredScript)`);
                        round.prison.detain(
                            { ...address, accountKey },
                            {
                                errorCode: error.errorCode,
                                sentenceEnd: Infinity, // this address should never be recycled
                            },
                        );

                        return tryToRegisterOutput(false);
                    }
                    if (error.errorCode === WabiSabiProtocolErrorCode.NotEnoughFunds) {
                        logger.error(
                            `NotEnoughFunds. Amount: ${amountCredentials[0].Value} Delta: ${outputAmountCredentials.CredentialsRequest.Delta} FeeRate: ${roundParameters.MiningFeeRate}`,
                        );
                    }
                }

                throw error;
            });
    };

    const address = await tryToRegisterOutput();
    round.prison.detain(
        { ...address, accountKey },
        {
            roundId: round.id,
            errorCode: WabiSabiProtocolErrorCode.AlreadyRegisteredScript,
        },
    );

    round.addresses.push({ ...address, accountKey });
};

const readyToSign = (
    { id, phaseDeadline }: CoinjoinRound,
    input: Alice,
    { signal, coordinatorUrl }: CoinjoinRoundOptions,
) =>
    coordinator.readyToSign(id, input.registrationData!.AliceId, !!input.affiliationFlag, {
        signal,
        baseUrl: coordinatorUrl,
        identity: input.outpoint, // NOTE: recycle input identity
        delay: scheduleDelay(phaseDeadline - Date.now()),
        deadline: phaseDeadline,
    });

export const outputRegistration = async (
    round: CoinjoinRound,
    accounts: Account[],
    options: CoinjoinRoundOptions,
) => {
    const { logger } = options;

    // in case of error we want to know it it happened during credential-issuance (outputDecomposition) or output-registration
    let phaseStep = 0;

    logger.info(`outputRegistration: ~~${round.id}~~`);
    // TODO:
    // - decide if there is only 1 account registered should i abaddon this round and blame it on some "youngest" input?
    // - maybe if there is only 1 account inputs are so "far away" from each other that it is wort to mix anyway?
    try {
        round.setSessionPhase(SessionPhase.RegisteringOutputs);
        // decompose output amounts for all registered inputs grouped by Account
        const decomposedGroup = await outputDecomposition(round, accounts, options);

        // first step completed
        phaseStep = 1;

        await Promise.all(
            decomposedGroup.map(({ accountKey, outputs }) => {
                const account = accounts.find(a => a.accountKey === accountKey);
                if (!account) throw new Error(`Unknown account ~~${accountKey}~~`);

                const assignedAddresses: AccountAddress[] = [];

                return Promise.all(
                    arrayShuffle(outputs).map(output =>
                        registerOutput(round, account, output, assignedAddresses, options),
                    ),
                );
            }),
        );

        round.setSessionPhase(SessionPhase.AwaitingOthersOutputs);
        // inform coordinator that each registered input is ready to sign
        await Promise.all(
            arrayShuffle(round.inputs).map(input => readyToSign(round, input, options)),
        );
        logger.info(`Ready to sign ~~${round.id}~~`);
    } catch (error) {
        // NOTE: if anything goes wrong in this process this Round will be corrupted for all the users
        // registered inputs will probably be banned
        const message = `Output registration in ~~${round.id}~~ failed: ${error.message}`;
        logger.error(`Output registration failed: (${phaseStep}) ${error.message}`);
        round.setSessionPhase(SessionPhase.OutputRegistrationFailed);

        round.inputs.forEach(input => input.setError(new Error(message)));
    }

    return round;
};
