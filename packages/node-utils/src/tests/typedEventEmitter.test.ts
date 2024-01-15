import { TypedEmitter } from '../typedEventEmitter';

type PayloadUnion = { foo: number } | { bar: string };

type Events = {
    obj: { id: string };
    bool: boolean;
    nr: number;
    str: string;
    union: PayloadUnion;
    unionMultiple: (a: PayloadUnion, b: PayloadUnion) => Promise<void>;
    noArgs: undefined;
    multipleArgs: (a: number, b: (success: boolean, err?: Error) => void) => void;
    [type: `dynamic/${string}`]: [(str: string) => boolean];
};

describe('typedEventEmitter', () => {
    const emitter = new TypedEmitter<Events>();

    beforeEach(() => {
        emitter.removeAllListeners();
    });

    it('object payload', () => {
        emitter.once('obj', obj => {
            expect(typeof obj.id).toBe('string');
        });
        emitter.emit('obj', { id: 'id' });
        emitter.off('obj', obj => {
            expect(typeof obj.id).toBe('string');
        });
        emitter.removeAllListeners('obj');

        // @ts-expect-error
        emitter.emit('obj');
        // @ts-expect-error
        emitter.emit('obj', 1);
    });

    it('no payload', () => {
        // @ts-expect-error
        emitter.on('noArgs', arg => {
            expect(typeof arg).toBe('undefined');
        });
        emitter.emit('noArgs');
        emitter.removeAllListeners('noArgs');
    });

    it('boolean payload', () => {
        emitter.once('bool', bool => {
            expect(typeof bool).toBe('boolean');
        });
        emitter.emit('bool', true);

        // @ts-expect-error
        emitter.emit('bool');
        // @ts-expect-error
        emitter.emit('bool', 1);

        emitter.on('nr', nr => expect(nr).toBe(1));

        const asyncCb = (nr: number) => Promise.resolve(expect(nr).toBe(1));
        emitter.on('nr', asyncCb);
    });

    it('union payload', () => {
        emitter.on('union', m => {
            if (!m) return;

            if ('foo' in m) {
                expect(m.foo).toBe(1);
            }

            if ('bar' in m) {
                expect(m.bar).toBe('bar');
            }
        });

        const p = emitter.listenerCount('union') > 0 ? { foo: 1 } : { bar: 'bar' };

        emitter.emit('union', p);
        emitter.emit('unionMultiple', p, p);
        emitter.emit('union', { foo: 1 });
        emitter.emit('unionMultiple', { foo: 1 }, { bar: 'bar' });
        emitter.emit('union', { bar: 'bar' });

        // @ts-expect-error
        emitter.emit('union');
        // @ts-expect-error
        emitter.emit('union', { foo: 1, err: 'err' });
    });

    it('multiple arguments', () => {
        // @ts-expect-error
        emitter.emit('multipleArgs');
        // @ts-expect-error
        emitter.emit('multipleArgs', true);
        // @ts-expect-error
        emitter.emit('multipleArgs', [1, () => {}]);

        emitter.on('multipleArgs', (nr, callback) => {
            expect(typeof nr).toBe('number');
            expect(typeof callback).toBe('function');

            callback(false, new Error('a'));
        });
        emitter.emit('multipleArgs', 1, (_a, _b) => {});
    });

    it('dynamic event name', () => {
        emitter.on('dynamic/abc', ([cb]) => {
            const resp = cb('foo');
            expect(typeof resp).toBe('boolean');
        });

        emitter.emit('dynamic/abc', [(str: string) => typeof str === 'string']);
        // @ts-expect-error
        emitter.emit('dynamic', (str: string) => typeof str === 'string');
    });
});
