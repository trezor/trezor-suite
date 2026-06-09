import { createCollection } from '../createCollection';
import { subscribeToQuery } from '../subscribeToQuery';

type Tx = { txid: string; title: string };

const tx = (txid: string, title: string): Tx => ({ txid, title });

describe('subscribeToQuery', () => {
    const setup = () => {
        const c = createCollection<Tx>({ getId: t => t.txid });
        c.addAll([tx('a', 'Alice'), tx('b', 'Bob')]);
        const search = c.defineFilterQuery((t, q: string) => t.title.includes(q));

        return { c, search };
    };

    it('fires only when the query result changes', () => {
        const { c, search } = setup();
        const onChange = jest.fn();
        subscribeToQuery(c, search, 'Al', onChange);

        // Irrelevant change -> no callback.
        c.add(tx('c', 'Bobby'));
        expect(onChange).not.toHaveBeenCalled();

        // Relevant change -> one callback with the new result.
        c.add(tx('d', 'Albert'));
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].map((t: Tx) => t.txid)).toEqual(['a', 'd']);
    });

    it('does not fire when an unaffected entity is updated', () => {
        const { c, search } = setup();
        const onChange = jest.fn();
        subscribeToQuery(c, search, 'Al', onChange);

        // 'b' changes value but still doesn't match 'Al' -> membership unchanged.
        c.add(tx('b', 'Bobby'));
        expect(onChange).not.toHaveBeenCalled();
    });

    it('emits the initial result when requested', () => {
        const { c, search } = setup();
        const onChange = jest.fn();
        subscribeToQuery(c, search, 'Al', onChange, { emitInitial: true });

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.calls[0][0].map((t: Tx) => t.txid)).toEqual(['a']);
    });

    it('stops firing after unsubscribe', () => {
        const { c, search } = setup();
        const onChange = jest.fn();
        const unsubscribe = subscribeToQuery(c, search, 'Al', onChange);

        unsubscribe();
        c.add(tx('d', 'Albert'));
        expect(onChange).not.toHaveBeenCalled();
    });
});
