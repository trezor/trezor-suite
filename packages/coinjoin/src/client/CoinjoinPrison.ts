import { TypedEmitter } from '@trezor/utils/lib/typedEventEmitter';

import { CoinjoinPrisonInmate, CoinjoinPrisonEvents } from '../types/client';
import { WabiSabiProtocolErrorCode } from '../enums';

export interface DetainOptions {
    roundId?: string;
    errorCode?: CoinjoinPrisonInmate['errorCode'];
    reason?: CoinjoinPrisonInmate['reason'];
    sentenceEnd?: number;
}

// Errored or currently registered inputs and addresses are sent here
// inspiration: WalletWasabi/WabiSabi/Backend/Banning/Prison.cs

export class CoinjoinPrison extends TypedEmitter<CoinjoinPrisonEvents> {
    inmates: CoinjoinPrisonInmate[] = [];
    private changeEventThrottle:
        | ReturnType<typeof setImmediate>
        | ReturnType<typeof setTimeout>
        | undefined;

    constructor(initialState: CoinjoinPrisonInmate[] = []) {
        super();
        this.inmates = initialState;
    }

    private dispatchChange() {
        // throttle change events. might be emitted one after another (example: multiple detentions in loop after round end)
        const emitFn = () => {
            this.changeEventThrottle = undefined;
            this.emit('change', { prison: this.inmates });
        };

        if (typeof setImmediate !== 'undefined') {
            clearImmediate(this.changeEventThrottle as NodeJS.Immediate);
            this.changeEventThrottle = setImmediate(emitFn);
        } else {
            clearTimeout(this.changeEventThrottle as NodeJS.Timeout);
            this.changeEventThrottle = setTimeout(emitFn, 0);
        }
    }

    detain(id: string, options: DetainOptions = {}) {
        const sentenceStart = Date.now();
        const sentenceEnd = Date.now() + (options.sentenceEnd ? options.sentenceEnd : 6 * 60000);

        this.inmates = this.inmates
            .filter(i => i.id !== id)
            .concat({
                id,
                sentenceEnd,
                sentenceStart,
                errorCode: options.errorCode,
                reason: options.reason,
                roundId: options.roundId,
            });

        this.dispatchChange();
    }

    isDetained(id: string) {
        return this.inmates.find(i => i.id === id);
    }

    detainForBlameRound(ids: string[], roundId: string) {
        ids.forEach(id => {
            this.detain(id, {
                errorCode: 'blameOf',
                roundId,
            });
        });
    }

    getBlameOfInmates() {
        return this.inmates.filter(i => i.errorCode === 'blameOf');
    }

    releaseBlameOfInmates(roundId: string) {
        this.inmates = this.inmates.filter(inmate => inmate.roundId !== roundId);

        this.dispatchChange();
    }

    // release inputs detained by successful input-registration
    releaseRegisteredInmates(roundId: string) {
        this.inmates = this.inmates.filter(
            inmate =>
                !(
                    inmate.roundId === roundId &&
                    inmate.errorCode === WabiSabiProtocolErrorCode.AliceAlreadyRegistered
                ),
        );

        this.dispatchChange();
    }

    // called on each status change before rounds are processed
    release() {
        const now = Date.now();
        const prevLen = this.inmates.length;
        this.inmates = this.inmates.filter(inmate => inmate.sentenceEnd > now);

        if (prevLen !== this.inmates.length) {
            this.dispatchChange();
        }
    }
}
