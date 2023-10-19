import { enumUtils, getRandomNumberInRange } from '@trezor/utils';

import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';
import { EndRoundState, WabiSabiProtocolErrorCode } from '../../enums';
import { getBroadcastedTxDetails } from '../../utils/roundUtils';

/**
 * RoundPhase: 4, Ending
 *
 * Process endRoundState:
 * - check if Round was signed successfully by this instance and throw error if not
 * - catch blame round
 * - catch transaction broadcasted
 */

export const ended = (round: CoinjoinRound, { logger, network }: CoinjoinRoundOptions) => {
    const { id, endRoundState, inputs, addresses, prison } = round;
    const endRoundKey = enumUtils.getKeyByValue(EndRoundState, round.endRoundState);
    logger.info(`Ending round ~~${round.id}~~. End state: ${endRoundKey}`);

    // check if Round was not signed by this instance.
    // possible edge cases:
    // - Round awaits for affiliateData from the Status but data are not provided before transactionSigningTimeout.
    // - Round in critical phase awaits for Status phase change but update is not provided because of network problems.
    // Round ends and this instance is to blame for it.
    // inputs will probably be banned even if there was no error while processing.
    if (
        [EndRoundState.NotAllAlicesSign, EndRoundState.AbortedNotEnoughAlicesSigned].includes(
            endRoundState,
        ) &&
        !round.isSignedSuccessfully()
    ) {
        // check reasons:
        if (inputs.some(i => !i.confirmationData)) {
            // no confirmed inputs
            logger.error('Round not signed. Missing confirmed inputs.');
        } else if (addresses.length === 0) {
            // no registered outputs
            logger.error('Round not signed. Missing outputs.');
        } else if (!round.affiliateRequest) {
            // missing affiliateRequest
            const times = round.transactionSignTries.join(',');
            logger.error(`Round not signed. Missing affiliate request. Status fetched at ${times}`);
        } else if (inputs.some(i => !i.witness)) {
            // no signed inputs
            logger.error('Round not signed. Missing signed inputs.');
        } else {
            // not signed because of other reason however
            logger.error(`Round not signed. This should never happen.`);
        }

        // assume that inputs are not banned but just noted.
        // all depends on the coordinator `AllowNotedInputRegistration` flag which is not visible in the Status
        // https://github.com/zkSNACKs/WalletWasabi/blob/master/WalletWasabi/WabiSabi/Backend/Rounds/Arena.Partial.cs#L414
        // give used inputs/outputs some random cool off time and try again,
        // repeated input-registration will tell if they are really banned,
        // make sure that addresses registered in round are recycled (reset Infinity sentence)
        const minute = 60 * 1000;
        const sentenceEnd = getRandomNumberInRange(5 * minute, 10 * minute);
        [...inputs, ...addresses].forEach(vinvout =>
            prison.detain(vinvout, {
                sentenceEnd,
            }),
        );
    } else if (endRoundState === EndRoundState.NotAllAlicesSign) {
        logger.info('Awaiting blame round');

        prison.detainForBlameRound([...inputs, ...addresses], id);
    } else if (endRoundState === EndRoundState.AbortedNotEnoughAlices) {
        prison.releaseRegisteredInmates(id);
    } else if (endRoundState === EndRoundState.TransactionBroadcasted) {
        // detain all signed inputs and addresses forever
        inputs.forEach(input =>
            prison.detain(input, {
                roundId: id,
                errorCode: WabiSabiProtocolErrorCode.InputSpent,
                sentenceEnd: Infinity,
            }),
        );

        addresses.forEach(addr =>
            prison.detain(addr, {
                roundId: id,
                errorCode: WabiSabiProtocolErrorCode.AlreadyRegisteredScript,
                sentenceEnd: Infinity,
            }),
        );

        round.broadcastedTxDetails = getBroadcastedTxDetails({
            coinjoinState: round.coinjoinState,
            transactionData: round.transactionData,
            network,
        });
    }

    return round;
};
