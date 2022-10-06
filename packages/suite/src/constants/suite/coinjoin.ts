import { TranslationKey } from '@suite-common/intl-types';
import { RoundPhase } from '@suite-common/wallet-types';

export const COINJOIN_PHASE_MESSAGES: Record<RoundPhase, TranslationKey> = {
    [RoundPhase.InputRegistration]: 'TR_COINJOIN_PHASE_0_MESSAGE',
    [RoundPhase.ConnectionConfirmation]: 'TR_COINJOIN_PHASE_1_MESSAGE',
    [RoundPhase.OutputRegistration]: 'TR_COINJOIN_PHASE_2_MESSAGE',
    [RoundPhase.TransactionSigning]: 'TR_COINJOIN_PHASE_3_MESSAGE',
    [RoundPhase.Ended]: 'TR_COINJOIN_PHASE_4_MESSAGE',
};
