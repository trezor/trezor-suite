import { TranslationKey } from '@suite-common/intl-types';
import { RoundPhase, SessionPhase } from '@wallet-types/coinjoin';

export const ROUND_PHASE_MESSAGES: Record<RoundPhase, TranslationKey> = {
    [RoundPhase.InputRegistration]: 'TR_COINJOIN_PHASE_0_MESSAGE',
    [RoundPhase.ConnectionConfirmation]: 'TR_COINJOIN_PHASE_1_MESSAGE',
    [RoundPhase.OutputRegistration]: 'TR_COINJOIN_PHASE_2_MESSAGE',
    [RoundPhase.TransactionSigning]: 'TR_COINJOIN_PHASE_3_MESSAGE',
    [RoundPhase.Ended]: 'TR_COINJOIN_PHASE_4_MESSAGE',
};

export const SESSION_PHASE_MESSAGES: Record<SessionPhase, TranslationKey> = {
    [SessionPhase.RoundSearch]: 'TR_SESSION_PHASE_11_MESSAGE',
    [SessionPhase.CoinSelection]: 'TR_SESSION_PHASE_12_MESSAGE',
    [SessionPhase.RoundPairing]: 'TR_SESSION_PHASE_13_MESSAGE',
    [SessionPhase.CoinRegistration]: 'TR_SESSION_PHASE_14_MESSAGE',
    [SessionPhase.AwaitingConfirmation]: 'TR_SESSION_PHASE_21_MESSAGE',
    [SessionPhase.AwaitingOthersConfirmation]: 'TR_SESSION_PHASE_22_MESSAGE',
    [SessionPhase.RegisteringOutputs]: 'TR_SESSION_PHASE_31_MESSAGE',
    [SessionPhase.AwaitingOthersOutputs]: 'TR_SESSION_PHASE_32_MESSAGE',
    [SessionPhase.AwaitingCoinjoinTransaction]: 'TR_SESSION_PHASE_41_MESSAGE',
    [SessionPhase.TransactionSigning]: 'TR_SESSION_PHASE_42_MESSAGE',
    [SessionPhase.SendingSignature]: 'TR_SESSION_PHASE_43_MESSAGE',
    [SessionPhase.AwaitingOtherSignatures]: 'TR_SESSION_PHASE_44_MESSAGE',
};

export const SESSION_PHASE_TRANSITION_DELAY = 3000;

/**
 * Values are upper limits of anonymity level for each status.
 */
export enum AnonymityStatus {
    Bad = 5,
    Medium = 10,
    Good = 20,
    Great = 100,
}
