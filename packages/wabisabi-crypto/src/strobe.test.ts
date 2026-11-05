import strobeTestVectors from './__fixtures__/strobeTestVectors.json';
import { fromHex, toHex } from './hex';
import { Strobe128, StrobeHasher } from './strobe';

type StrobeOperation = {
    name: string;
    custom_string?: string;
    input_length?: number;
    output?: string;
    meta?: boolean;
    input_data?: string;
    state_after: string;
};

const encode = (value: string) => new TextEncoder().encode(value);

describe('Strobe128', () => {
    // Port of `BehaiorIsDeterministic` in NWabiSabi/WabiSabi.Tests/Crypto/StrobeTests.cs
    it('behaviour is deterministic', () => {
        const strobe1 = new Strobe128('TestProtocol.v0.0.1');
        const strobe2 = new Strobe128('TestProtocol.v0.0.1');

        [strobe1, strobe2].forEach(strobe => {
            strobe.addAssociatedMetaData(encode('wabisabi://unitests/'), false);
            strobe.addAssociatedMetaData(encode('greeting/'), true);
            strobe.addAssociatedData(encode('hello'), false);
        });

        strobe1.addAssociatedMetaData(encode('prf'), false);
        let rnd1 = strobe1.prf(12, false);
        strobe2.addAssociatedMetaData(encode('prf'), false);
        let rnd2 = strobe2.prf(12, false);
        expect(toHex(rnd1)).toEqual(toHex(rnd2));

        strobe1.addAssociatedMetaData(encode('key'), false);
        strobe1.key(rnd1, false);
        strobe2.addAssociatedMetaData(encode('key'), false);
        strobe2.key(rnd2, false);

        strobe1.addAssociatedMetaData(encode('prf'), false);
        rnd1 = strobe1.prf(12, false);
        strobe2.addAssociatedMetaData(encode('prf'), false);
        rnd2 = strobe2.prf(12, false);
        expect(toHex(rnd1)).toEqual(toHex(rnd2));

        const strobe1State = toHex(strobe1.dumpState());
        const strobe3 = strobe1.makeCopy();
        expect(toHex(strobe3.dumpState())).toEqual(strobe1State);

        strobe1.addAssociatedData(encode('Something'), false);
        expect(toHex(strobe1.dumpState())).not.toEqual(toHex(strobe3.dumpState()));
        expect(toHex(strobe1.dumpState())).not.toEqual(strobe1State);
    });

    it('a copy does not share state with its original', () => {
        const original = new Strobe128('TestProtocol.v0.0.1');
        const copy = original.makeCopy();

        copy.addAssociatedData(encode('only in the copy'), false);

        expect(toHex(original.dumpState())).not.toEqual(toHex(copy.dumpState()));
        expect(original.position).not.toEqual(copy.position);
    });

    it('rejects an empty protocol name', () => {
        expect(() => new Strobe128('')).toThrow('protocol cannot be empty.');
    });

    it('rejects continuing an operation with different flags', () => {
        const strobe = new Strobe128('TestProtocol.v0.0.1');
        strobe.addAssociatedMetaData(encode('meta'), false);

        expect(() => strobe.addAssociatedData(encode('data'), true)).toThrow('is not allowed');
    });

    // Port of `TestVectors` in NWabiSabi/WabiSabi.Tests/Crypto/StrobeTests.cs over the
    // vectors from https://github.com/mimoo/StrobeGo. The streaming vectors are skipped
    // upstream because streaming is not implemented.
    describe.each(
        strobeTestVectors.test_vectors.filter(vector => !vector.name.includes('streaming')),
    )('$name', ({ operations }) => {
        it('matches the reference state after every operation', () => {
            const [init, ...rest] = operations as StrobeOperation[];
            const strobe = new Strobe128((init as StrobeOperation).custom_string as string);
            expect(toHex(strobe.dumpState()).toLowerCase()).toEqual(
                (init as StrobeOperation).state_after.toLowerCase(),
            );

            let operationCount = 0;
            for (const operation of rest) {
                if (!['KEY', 'AD', 'PRF'].includes(operation.name)) {
                    break;
                }
                switch (operation.name) {
                    case 'KEY':
                        strobe.key(fromHex(operation.input_data as string), false);
                        break;
                    case 'AD':
                        if (operation.meta) {
                            strobe.addAssociatedMetaData(
                                fromHex(operation.input_data as string),
                                false,
                            );
                        } else {
                            strobe.addAssociatedData(
                                fromHex(operation.input_data as string),
                                false,
                            );
                        }
                        break;
                    case 'PRF': {
                        const output = strobe.prf(operation.input_length as number, false);
                        expect(toHex(output).toLowerCase()).toEqual(
                            (operation.output as string).toLowerCase(),
                        );
                        break;
                    }
                    default:
                        break;
                }
                expect(toHex(strobe.dumpState()).toLowerCase()).toEqual(
                    operation.state_after.toLowerCase(),
                );
                operationCount++;
            }

            expect(operationCount).toBeGreaterThan(0);
        });
    });
});

describe('StrobeHasher', () => {
    it('is deterministic and domain separated', () => {
        const hash = (domain: string, field: string, value: string) =>
            toHex(StrobeHasher.create(domain).appendBytes(field, encode(value)).getHash());

        expect(hash('a', 'Field', 'value')).toEqual(hash('a', 'Field', 'value'));
        expect(hash('a', 'Field', 'value')).not.toEqual(hash('b', 'Field', 'value'));
        expect(hash('a', 'Field', 'value')).not.toEqual(hash('a', 'Other', 'value'));
        expect(hash('a', 'Field', 'value')).not.toEqual(hash('a', 'Field', 'other'));
        expect(fromHex(hash('a', 'Field', 'value'))).toHaveLength(32);
    });
});
