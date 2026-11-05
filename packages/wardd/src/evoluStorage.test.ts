import { EvoluWardStorage } from './evoluStorage';

it('logs Evolu lookup misses, hits, checkpoints and transition reads without wallet contents', async () => {
    const lines: unknown[][] = [];
    const storage = await EvoluWardStorage.open({
        dataDir: null,
        log: (...messages) => lines.push(messages),
    });
    try {
        expect(storage.lookup('private-ward', 'bitcoin', 'private-address', 'btc')).toBeNull();
        await storage.upsert('private-ward', 'bitcoin', 'private-address', 'btc', {
            counter: 1,
            metadata: { label: 'private-label' },
        });
        expect(storage.lookup('private-ward', 'bitcoin', 'private-address', 'btc')).not.toBeNull();
        storage.getTreeState('private-ward');
        storage.getAllEntries('private-ward');
        storage.getByEntryKey('private-ward', 'private-key');
        storage.getTransitions('private-ward');
        const responses = lines.filter(line => line[0] === 'response').map(line => line[1]);
        expect(responses).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ operation: 'evolu.lookup', found: false }),
                expect.objectContaining({ operation: 'evolu.lookup', found: true }),
                expect.objectContaining({ operation: 'evolu.getTreeState', found: false }),
                expect.objectContaining({ operation: 'evolu.getTransitions', rows: 0 }),
            ]),
        );
        expect(JSON.stringify(lines)).not.toContain('private-');
    } finally {
        await storage.dispose();
    }
});
