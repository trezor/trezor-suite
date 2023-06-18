import { TranslationKey } from '@suite-common/intl-types';
import { RoundPhase, SessionPhase } from 'src/types/wallet/coinjoin';

export const ROUND_PHASE_MESSAGES: Record<RoundPhase, TranslationKey> = {
    [RoundPhase.InputRegistration]: 'TR_COINJOIN_PHASE_0_MESSAGE',
    [RoundPhase.ConnectionConfirmation]: 'TR_COINJOIN_PHASE_1_MESSAGE',
    [RoundPhase.OutputRegistration]: 'TR_COINJOIN_PHASE_2_MESSAGE',
    [RoundPhase.TransactionSigning]: 'TR_COINJOIN_PHASE_3_MESSAGE',
    [RoundPhase.Ended]: 'TR_COINJOIN_PHASE_4_MESSAGE',
};

export const SESSION_PHASE_MESSAGES: Record<SessionPhase, TranslationKey> = {
    [SessionPhase.RoundSearch]: 'TR_SESSION_PHASE_ROUND_SEARCH',
    [SessionPhase.CoinSelection]: 'TR_SESSION_PHASE_COIN_SELECTION',
    [SessionPhase.RoundPairing]: 'TR_SESSION_PHASE_ROUND_PAIRING',
    [SessionPhase.CoinRegistration]: 'TR_SESSION_PHASE_COIN_REGISTRATION',
    [SessionPhase.AccountMissingUtxos]: 'TR_SESSION_ERROR_PHASE_MISSING_UTXOS',
    [SessionPhase.SkippingRound]: 'TR_SESSION_ERROR_PHASE_SKIPPING_ROUND',
    [SessionPhase.RetryingRoundPairing]: 'TR_SESSION_ERROR_PHASE_RETRYING_PAIRING',
    [SessionPhase.AffiliateServerOffline]: 'TR_SESSION_ERROR_PHASE_AFFILIATE_SERVERS_OFFLINE',
    [SessionPhase.CriticalError]: 'TR_SESSION_ERROR_PHASE_CRITICAL_ERROR',
    [SessionPhase.BlockedUtxos]: 'TR_SESSION_ERROR_PHASE_BLOCKED_UTXOS',
    [SessionPhase.AwaitingConfirmation]: 'TR_SESSION_PHASE_AWAITING_CONFIRMATION',
    [SessionPhase.AwaitingOthersConfirmation]: 'TR_SESSION_PHASE_WAITING_FOR_OTHERS',
    [SessionPhase.RegisteringOutputs]: 'TR_SESSION_PHASE_REGISTERING_OUTPUTS',
    [SessionPhase.AwaitingOthersOutputs]: 'TR_SESSION_PHASE_WAITING_FOR_COORDINATOR',
    [SessionPhase.OutputRegistrationFailed]: 'TR_SESSION_ERROR_PHASE_REGISTRATION_FAILED',
    [SessionPhase.AwaitingCoinjoinTransaction]: 'TR_SESSION_PHASE_AWAITING_TRANSACTION',
    [SessionPhase.TransactionSigning]: 'TR_SESSION_PHASE_TRANSACTION_SIGNING',
    [SessionPhase.SendingSignature]: 'TR_SESSION_PHASE_SENDING_SIGNATURE',
    [SessionPhase.AwaitingOtherSignatures]: 'TR_SESSION_PHASE_AWAITING_SIGNATURES',
    [SessionPhase.SignatureFailed]: 'TR_SESSION_PHASE_SIGNING_FAILED',
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
