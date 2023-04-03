import { enumUtils } from '@trezor/utils';

import type { CoinjoinRound, CoinjoinRoundOptions } from '../CoinjoinRound';
import { EndRoundState } from '../../enums';
import { WabiSabiProtocolErrorCode } from '../../types/coordinator';
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
            logger.error('Round not signed. Missing affiliate request.');
        } else if (inputs.some(i => !i.witness)) {
            // no signed inputs
            logger.error('Round not signed. Missing signed inputs.');
        } else {
            // not signed because of other reason however
            logger.error(`Round not signed. This should never happen.`);
        }
        inputs.forEach(input =>
            prison.detain(input.outpoint, {
                roundId: id,
                reason: WabiSabiProtocolErrorCode.InputBanned,
            }),
        );
    } else if (endRoundState === EndRoundState.NotAllAlicesSign) {
        logger.info('Awaiting blame round');
        const inmates = inputs.map(i => i.outpoint).concat(addresses.map(a => a.scriptPubKey));

        prison.detainForBlameRound(inmates, id);
    } else if (endRoundState === EndRoundState.AbortedNotEnoughAlices) {
        prison.releaseRegisteredInmates(id);
    } else if (endRoundState === EndRoundState.TransactionBroadcasted) {
        // detain all signed inputs and addresses forever
        inputs.forEach(input =>
            prison.detain(input.outpoint, {
                roundId: id,
                reason: WabiSabiProtocolErrorCode.InputSpent,
                sentenceEnd: Infinity,
            }),
        );

        addresses.forEach(addr =>
            prison.detain(addr.scriptPubKey, {
                roundId: id,
                reason: WabiSabiProtocolErrorCode.AlreadyRegisteredScript,
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
