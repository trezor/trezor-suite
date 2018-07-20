/* @flow */

import { Stream, Emitter } from './utils/stream';
import type { Blockchain, SyncStatus, TransactionWithHeight, TxFees } from './bitcore';

const TICK_MS = 50;

type EmitterSpec = {
    type: 'error',
    error: string,
} | {
    type: 'transaction',
    transaction: TransactionWithHeight,
} | {
    type: 'block',
};

type CallSpec = {
    type: 'subsbscribe',
    addresses: Array<string>,
} | {
    type: 'lookupTransactionsStream',
    addresses: Array<string>,
    start: number,
    end: number,
    result: Array<TransactionWithHeight> | string,
} | {
    type: 'lookupTransactionsIds',
    addresses: Array<string>,
    start: number,
    end: number,
    result: Array<string> | string,
} | {
    type: 'lookupBlockHash',
    height: string,
    resultError: boolean,
    result: string,
} | {
    type: 'lookupSyncStatus',
    result: SyncStatus | string,
};

type Spec = {
    type: 'emitter',
    spec: EmitterSpec,
} | {
    type: 'call',
    spec: CallSpec,
}

export class MockBitcore {
    errorsEmitter: Emitter<Error> = new Emitter();
    errors: Stream<Error> = Stream.fromEmitter(this.errorsEmitter, () => {});

    notificationsEmitter: Emitter<TransactionWithHeight> = new Emitter();
    notifications: Stream<TransactionWithHeight> = Stream.fromEmitter(this.notificationsEmitter, () => {});

    blocksEmitter: Emitter<void> = new Emitter();
    blocks: Stream<void> = Stream.fromEmitter(this.blocksEmitter, () => {});

    workingUrl: string = 'url';

    specLock: boolean = false;
    spec: Array<Spec>;

    doneError: (f: Error) => any;
    deepEqual: (a: any, b: any) => any;
    errored: boolean = false;
    constructor(spec: Array<Spec>, doneError: (f: Error) => any) {
        this.spec = spec;
        this.doneError = (f: Error) => {
            if (!this.errored) {
                doneError(f);
            }
            this.errored = true;
        };
        this.emit();
    }

    emit() {
        if (this.spec.length > 0) {
            const sspec = this.spec[0];
            if (sspec.type === 'emitter') {
                this.specLock = true;
                const spec: EmitterSpec = sspec.spec;
                this.spec.shift();
                setTimeout(() => {
                    this.specLock = false;
                    if (spec.type === 'error') {
                        this.errorsEmitter.emit(new Error(spec.error));
                    }
                    if (spec.type === 'transaction') {
                        this.notificationsEmitter.emit(spec.transaction);
                    }
                    if (spec.type === 'block') {
                        this.blocksEmitter.emit();
                    }
                    this.emit();
                }, TICK_MS);
            }
        }
    }

    getCallSpec(type: string): CallSpec {
        if (this.spec.length === 0) {
            this.doneError(new Error('Call spec not defined, wanted ' + type));
            throw new Error();
        }
        if (this.specLock) {
            this.doneError(new Error('call spec out of order, is waiting but wanted ' + type));
            throw new Error();
        }
        const sspec = this.spec[0];
        if (sspec.type !== 'call') {
            this.doneError(new Error('call spec out of order, is emit but wanted ' + type));
            throw new Error();
        }
        const {spec} = sspec;
        this.spec.shift();
        if (spec.type !== type) {
            this.doneError(new Error('call spec out of order, is ' + spec.type + ' but wanted ' + type));
            throw new Error();
        }
        console.log('Succesful call spec type', type);
        return spec;
    }

    subscribe(addresses: Set<string>): void {
        const spec = this.getCallSpec('subscribe');
        if (spec.type !== 'subscribe') {
            this.doneError(new Error('call spec out of order'));
            throw new Error();
        }
        if (!arrayEqSet(spec.addresses, addresses)) {
            console.error('Expected:', spec.addresses);
            console.error('Got:', addresses);
            this.doneError(new Error('wrong address set on subscribe'));
        }
    }

    lookupTransactionsStream(
        addresses: Array<string>,
        start: number,
        end: number
    ): Stream<Array<TransactionWithHeight> | Error> {
        const spec = this.getCallSpec('lookupTransactionsStream');
        if (spec.type !== 'lookupTransactionsStream') {
            this.doneError(new Error('call spec out of order'));
            throw new Error();
        }
        if (JSON.stringify(spec.addresses) !== JSON.stringify(addresses)) {
            console.error('Expected:', spec.addresses);
            console.error('Got:', addresses);
            this.doneError(new Error('wrong addresses'));
            throw new Error();
        }

        if (spec.start !== start) {
            console.error('Start in spec:', spec.start);
            console.error('Start in test:', start);
            this.doneError(new Error('wrong start'));
            throw new Error();
        }
        if (spec.end !== end) {
            console.error('End in spec:', spec.end);
            console.error('End in test:', end);
            this.doneError(new Error('wrong end'));
            throw new Error();
        }

        const result: Array<TransactionWithHeight> | Error =
            typeof spec.result === 'string' ? new Error(spec.result) : spec.result;

        const emitter: Emitter<Array<TransactionWithHeight> | Error> = new Emitter();
        const finisher: Emitter<void> = new Emitter();
        const resultStream = Stream.fromEmitterFinish(emitter, finisher, () => {});
        setTimeout(() => {
            emitter.emit(result);
            setTimeout(() => {
                finisher.emit();
                this.emit();
            }, 10);
        }, 10);
        return resultStream;
    }

    lookupTransactionsIds(
        addresses: Array<string>,
        start: number,
        end: number
    ): Promise<Array<string>> {
        const spec = this.getCallSpec('lookupTransactionsIds');
        if (spec.type !== 'lookupTransactionsIds') {
            this.doneError(new Error('call spec out of order'));
            throw new Error();
        }
        if (JSON.stringify(spec.addresses) !== JSON.stringify(addresses)) {
            console.error('Expected:', spec.addresses);
            console.error('Got:', addresses);
            this.doneError(new Error('wrong addresses'));
            throw new Error();
        }

        if (spec.start !== start) {
            console.error('Expected:', spec.start);
            console.error('Got:', start);
            this.doneError(new Error('wrong start'));
            throw new Error();
        }
        if (spec.end !== end) {
            console.error('Expected:', spec.end);
            console.error('Got:', end);
            this.doneError(new Error('wrong end'));
            throw new Error();
        }

        if (typeof spec.result === 'string') {
            this.emit();
            return Promise.reject(new Error(spec.result));
        } else {
            const result_: Array<string> = spec.result;
            return new Promise((resolve) => setTimeout(() => {
                this.emit();
                resolve(result_);
            }, TICK_MS));
        }
    }

    lookupBlockHash(height: number): Promise<string> {
        const spec = this.getCallSpec('lookupBlockHash');
        if (spec.type !== 'lookupBlockHash') {
            this.doneError(new Error('call spec out of order'));
            throw new Error();
        }
        if (spec.height !== height) {
            console.error('Expected:', spec.height);
            console.error('Got:', height);
            this.doneError(new Error('wrong height'));
            throw new Error();
        }
        if (spec.resultError) {
            this.emit();
            return Promise.reject(new Error(spec.result));
        } else {
            return new Promise((resolve) => setTimeout(() => {
                this.emit();
                resolve(spec.result);
            }, TICK_MS));
        }
    }

    lookupSyncStatus(): Promise<SyncStatus> {
        const spec = this.getCallSpec('lookupSyncStatus');
        if (spec.type !== 'lookupSyncStatus') {
            this.doneError(new Error('call spec out of order'));
            throw new Error();
        }
        if (typeof spec.result === 'string') {
            this.emit();
            return Promise.reject(new Error(spec.result));
        } else {
            const result_: SyncStatus = spec.result;
            return new Promise((resolve) => setTimeout(() => {
                this.emit();
                resolve(result_);
            }, TICK_MS));
        }
    }

    sendTransaction(hex: string): Promise<string> {
        return Promise.reject('Not mocked');
    }

    hardStatusCheck(): Promise<boolean> {
        return Promise.reject('Not mocked');
    }

    lookupTransaction(hash: string): Promise<TransactionWithHeight> {
        return Promise.reject('Not mocked');
    }

    estimateTxFees(blocks: Array<number>, skipMissing: boolean): Promise<TxFees> {
        return Promise.reject('Not mocked');
    }
}

function arrayEqSet<X>(array: Array<X>, set: Set<X>) {
    if (array.length !== set.size) {
        return false;
    }
    for (const a of array) {
        if (!set.has(a)) {
            return false;
        }
    }
    return true;
}

// eslint-disable-next-line  no-unused-vars
let flowTest: ?Blockchain = new MockBitcore([], () => {});
flowTest = null;
