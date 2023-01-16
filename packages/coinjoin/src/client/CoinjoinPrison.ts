import { WabiSabiProtocolErrorCode } from '../types/coordinator';

export interface PrisonInmate {
    id: string; // AccountUtxo/Alice.outpoint or AccountAddress scriptPubKey
    sentenceStart: number;
    sentenceEnd: number;
    reason?: string;
    roundId?: string;
}

export interface PrisonOptions {
    roundId?: string;
    reason?: string;
    sentenceEnd?: number;
}

// Errored or currently registered inputs and addresses are sent here
// inspiration: WalletWasabi/WabiSabi/Backend/Banning/Prison.cs

export class CoinjoinPrison {
    inmates: PrisonInmate[] = [];

    detain(id: string, options: PrisonOptions = {}) {
        const sentenceStart = Date.now();
        const sentenceEnd = Date.now() + (options.sentenceEnd ? options.sentenceEnd : 6 * 60000);

        this.inmates.push({
            id,
            sentenceEnd,
            sentenceStart,
            reason: options.reason,
            roundId: options.roundId,
        });
    }

    isDetained(id: string) {
        return this.inmates.find(i => i.id === id);
    }

    detainForBlameRound(ids: string[], roundId: string) {
        ids.forEach(id => {
            this.detain(id, {
                reason: 'blameOf',
                roundId,
            });
        });
    }

    getBlameOfInmates() {
        return this.inmates.filter(i => i.reason === 'blameOf');
    }

    releaseBlameOfInmates(roundId: string) {
        this.inmates = this.inmates.filter(inmate => inmate.roundId !== roundId);
    }

    // release inputs detained by successful input-registration
    releaseRegisteredInmates(roundId: string) {
        this.inmates = this.inmates.filter(
            inmate =>
                !(
                    inmate.roundId === roundId &&
                    inmate.reason === WabiSabiProtocolErrorCode.AliceAlreadyRegistered
                ),
        );
    }

    // called on each status change before rounds are processed
    release() {
        const now = Date.now();
        this.inmates = this.inmates.filter(inmate => inmate.sentenceEnd > now);
    }
}
