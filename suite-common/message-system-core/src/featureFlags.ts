import type { Message } from '@suite-common/suite-types';

export const KILLSWITCH_FEATURE_DOMAIN = 'killswitch';

/**
 * Finds the message that disables the whole app, if there is a valid one. The killswitch is the
 * one feature flag that is evaluated outside of the Redux layer as well, because the Electron main
 * process has to know about it before it serves anything.
 */
export const getKillswitchMessage = (messages: readonly Message[]) =>
    messages.find(
        message =>
            // A feature flag is only read from a message of the `feature` category, so main and
            // the renderer cannot disagree about a message that carries the field elsewhere.
            [message.category].flat().includes('feature') &&
            message.feature?.some(
                feature => feature.domain === KILLSWITCH_FEATURE_DOMAIN && feature.flag,
            ),
    );
