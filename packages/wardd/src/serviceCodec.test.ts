import { ServiceCodec } from './serviceCodec';
import { mockServiceTransport } from '../mocks/mockServiceTransport';

it('streams a 256-hop proof through 64-byte reports with cleared padding', async () => {
    const { transport, incoming, written } = mockServiceTransport();
    const codec = new ServiceCodec(transport);
    const proof = Array.from({ length: 256 }, (_, bit) =>
        Buffer.concat([Buffer.from([0, bit]), Buffer.alloc(32, 0x61)]).toString('hex'),
    );
    await codec.write({ name: 'WARDProofAck', message: { proof } });

    expect(written.every(report => report.length === 64)).toBe(true);
    expect(written[0]!.subarray(0, 3).toString()).toBe('?##');
    const size = written[0]!.readUInt32BE(5);
    expect(size).toBe(9216);
    const lastPayload = (size - 55) % 63;
    expect(
        written
            .at(-1)!
            .subarray(lastPayload + 1)
            .every(byte => byte === 0),
    ).toBe(true);
    incoming.push(...written);

    expect((await codec.read()).message.proof).toEqual(proof);
});

it('refuses a declared message size above the service bound', async () => {
    const { transport, incoming } = mockServiceTransport();
    const report = Buffer.alloc(64);
    report.write('?##');
    report.writeUInt32BE(65537, 5);
    incoming.push(report);

    await expect(new ServiceCodec(transport).read()).rejects.toThrow('message too large');
});

it('treats a missing continuation as a connection error rather than an idle poll', async () => {
    const { transport, incoming, written } = mockServiceTransport();
    const codec = new ServiceCodec(transport);
    await codec.write({
        name: 'WARDProofAck',
        message: { proof: ['61'.repeat(34), '62'.repeat(34)] },
    });
    incoming.push(written[0]!);

    await expect(codec.read()).rejects.toThrow('incomplete message');
});
