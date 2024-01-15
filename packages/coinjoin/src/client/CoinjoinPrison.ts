import { TypedEmitter } from '@trezor/node-utils/lib/typedEventEmitter';

import { CoinjoinPrisonInmate, CoinjoinPrisonEvents } from '../types/client';
import { WabiSabiProtocolErrorCode } from '../enums';

export type DetainObject =
    | {
          outpoint: string;
          accountKey: string;
      }
    | {
          address: string;
          accountKey: string;
      }
    | {
          accountKey: string;
      };

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

    detain(inmate: DetainObject, options: DetainOptions = {}) {
        const sentenceStart = Date.now();
        const sentenceEnd = Date.now() + (options.sentenceEnd ? options.sentenceEnd : 6 * 60000);

        let id: string;
        let type: CoinjoinPrisonInmate['type'];
        if ('outpoint' in inmate) {
            type = 'input';
            id = inmate.outpoint;
        } else if ('address' in inmate) {
            type = 'output';
            id = inmate.address;
        } else {
            type = 'account';
            id = inmate.accountKey;
        }

        this.inmates = this.inmates
            .filter(i => i.id !== id)
            .concat({
                id,
                type,
                accountKey: inmate.accountKey,
                sentenceEnd,
                sentenceStart,
                errorCode: options.errorCode,
                reason: options.reason,
                roundId: options.roundId,
            });

        this.dispatchChange();
    }

    isDetained(inmate: string | DetainObject) {
        let id: string;
        if (typeof inmate === 'string') {
            id = inmate;
        } else if ('outpoint' in inmate) {
            id = inmate.outpoint;
        } else if ('address' in inmate) {
            id = inmate.address;
        } else {
            id = inmate.accountKey;
        }
        return this.inmates.find(i => i.id === id);
    }

    detainForBlameRound(inmates: DetainObject[], roundId: string) {
        inmates.forEach(inmate => {
            this.detain(inmate, {
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
    release(rounds: string[]) {
        const now = Date.now();
        const prevLen = this.inmates.length;

        this.inmates = this.inmates.filter(inmate => {
            if (inmate.sentenceEnd !== Infinity && inmate.roundId) {
                // release inmates assigned to Round which is no longer present in Status
                // regardless of their sentenceEnd
                if (!rounds.includes(inmate.roundId)) return false;
            }
            return inmate.sentenceEnd > now;
        });

        if (prevLen !== this.inmates.length) {
            this.dispatchChange();
        }
    }
}
