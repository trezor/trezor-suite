import { getFreshAddresses, groupSignAddresses } from './signAddressGroups';

const LABEL = { id: 'TR_TEST', defaultMessage: 'Test' };
const first = { path: 'm/0/0', address: 'a0' };
const second = { path: 'm/0/1', address: 'a1' };

describe('getFreshAddresses', () => {
    it('prefers the revealed addresses', () => {
        expect(getFreshAddresses({ unused: [second], used: [], change: [] }, [first])).toEqual([
            first,
        ]);
    });

    it('falls back to the first unused address', () => {
        expect(getFreshAddresses({ unused: [second, first], used: [], change: [] }, [])).toEqual([
            second,
        ]);
        expect(getFreshAddresses(undefined, [])).toEqual([]);
    });
});

describe('groupSignAddresses', () => {
    it('keeps an address only in the last group that lists it and drops empty groups', () => {
        expect(
            groupSignAddresses([
                { label: LABEL, addresses: [first, second] },
                { label: null, addresses: [] },
                { label: LABEL, addresses: [first] },
            ]),
        ).toEqual([
            { label: LABEL, addresses: [second] },
            { label: LABEL, addresses: [first] },
        ]);
    });
});
