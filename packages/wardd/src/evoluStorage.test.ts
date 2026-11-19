import { EvoluWardStorage, WardSchema } from './evoluStorage';

it('keeps the transition log and logs its reads without wallet contents', async () => {
    const lines: unknown[][] = [];
    const storage = await EvoluWardStorage.open({
        dataDir: null,
        log: (...messages) => lines.push(messages),
    });
    try {
        expect(storage.getTransitions('private-ward')).toEqual([]);
        const record = {
            counter: 1,
            prevRoot: '',
            targetRoot: 'aa'.repeat(32),
            leaves: [],
            authCommit: 'private-auth',
        };
        await storage.appendTransition('private-ward', record);
        // An identical append is a no-op; a different record at the same key is refused.
        await storage.appendTransition('private-ward', record);
        await expect(
            storage.appendTransition('private-ward', { ...record, authCommit: 'other' }),
        ).rejects.toThrow('cannot rewrite');
        expect(storage.getTransitions('private-ward')).toEqual([record]);
        expect(Object.keys(WardSchema)).toEqual(['wardTransition', 'wardAcceptance']);
        const responses = lines.filter(line => line[0] === 'response').map(line => line[1]);
        expect(responses).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ operation: 'evolu.getTransitions', rows: 0 }),
                expect.objectContaining({ operation: 'evolu.getTransitions', rows: 1 }),
            ]),
        );
        expect(JSON.stringify(lines)).not.toContain('private-');
    } finally {
        await storage.dispose();
    }
});

it('keeps the WM acceptance beside each accepted transition, per wallet', async () => {
    const storage = await EvoluWardStorage.open({ dataDir: null });
    try {
        const acceptance = {
            counter: 1,
            targetRoot: 'aa'.repeat(32),
            timestamp: 1700000500,
            wmSignature: 'bb'.repeat(64),
        };
        expect(storage.getAcceptances('first')).toEqual([]);
        await storage.appendAcceptance('first', acceptance);
        // A retry of the same acceptance is a no-op; another one for that transition is refused.
        await storage.appendAcceptance('first', acceptance);
        await expect(
            storage.appendAcceptance('first', { ...acceptance, timestamp: 1700000501 }),
        ).rejects.toThrow('cannot rewrite');
        expect(storage.getAcceptances('first')).toEqual([acceptance]);
        expect(storage.getAcceptances('other')).toEqual([]);
    } finally {
        await storage.dispose();
    }
});

it('debug fault injection removes only the selected journal row', async () => {
    const storage = await EvoluWardStorage.open({ dataDir: null });
    try {
        for (const wallet of ['first', 'other']) {
            await storage.appendTransition(wallet, {
                counter: 1,
                prevRoot: '',
                targetRoot: 'aa',
                leaves: [],
            });
            await storage.appendTransition(wallet, {
                counter: 2,
                prevRoot: 'aa',
                targetRoot: 'bb',
                leaves: [],
            });
        }
        await storage.debugDropTransition('first', 2, 'bb');
        expect(storage.getTransitions('first').map(record => record.counter)).toEqual([1]);
        expect(storage.getTransitions('other').map(record => record.counter)).toEqual([1, 2]);
        await expect(storage.debugDropTransition('first', 2, 'bb')).rejects.toThrow('not found');
    } finally {
        await storage.dispose();
    }
});
