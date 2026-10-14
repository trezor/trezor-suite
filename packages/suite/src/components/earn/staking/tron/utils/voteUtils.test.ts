import { type TrxStats } from '@suite-common/earn-staking-api';

import {
    applyRepresentativeSelection,
    applyVoteReassignment,
    getRemainingVotes,
    getRepresentativeApr,
    getRepresentativeName,
    getVotingDelegationAnalyticsValue,
    getWeightedApr,
    parseVoteAllocations,
    parseVoteCount,
} from './voteUtils';

const REPRESENTATIVE_A = 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9';
const REPRESENTATIVE_B = 'TKWJhMU8NAviZ9TN5hroaFQPZ83FNctzz4';
const CUSTOM_ADDRESS = 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr';

const representatives: TrxStats = [
    { address: REPRESENTATIVE_A, name: 'P2P.org', url: 'https://p2p.org', apr: 3.27 },
    { address: REPRESENTATIVE_B, name: 'Luganodes', url: 'https://luganodes.com', apr: 3.28 },
];

describe('parseVoteCount', () => {
    it.each([
        ['7', 7],
        [' 7 ', 7],
        ['007', 7],
        ['0', 0],
    ])('parses %j as %i', (value, expected) => {
        expect(parseVoteCount(value)).toBe(expected);
    });

    it.each([[''], ['   '], ['-5'], ['1.5'], ['1e3'], ['abc']])(
        'rejects %j as not a whole number of votes',
        value => {
            expect(parseVoteCount(value)).toBeNull();
        },
    );
});

describe('parseVoteAllocations', () => {
    it('keeps rows with an address and a parsable count, including zero', () => {
        expect(
            parseVoteAllocations([
                { address: REPRESENTATIVE_A, votes: '16' },
                { address: REPRESENTATIVE_B, votes: '0' },
            ]),
        ).toEqual([
            { address: REPRESENTATIVE_A, count: 16 },
            { address: REPRESENTATIVE_B, count: 0 },
        ]);
    });

    it('leaves out rows without an address or with an unparsable count', () => {
        expect(
            parseVoteAllocations([
                { address: '', votes: '16' },
                { address: REPRESENTATIVE_A, votes: 'x' },
                { address: REPRESENTATIVE_B, votes: '30' },
            ]),
        ).toEqual([{ address: REPRESENTATIVE_B, count: 30 }]);
    });
});

describe('getRemainingVotes', () => {
    it('subtracts the assigned votes from the total', () => {
        expect(
            getRemainingVotes({
                totalVotes: 46,
                allocations: [
                    { address: REPRESENTATIVE_A, votes: '16' },
                    { address: REPRESENTATIVE_B, votes: '30' },
                ],
            }),
        ).toBe(0);
    });

    it('goes negative when more votes are assigned than available', () => {
        expect(
            getRemainingVotes({
                totalVotes: 46,
                allocations: [{ address: REPRESENTATIVE_A, votes: '50' }],
            }),
        ).toBe(-4);
    });

    it('ignores rows that cannot be parsed', () => {
        expect(
            getRemainingVotes({
                totalVotes: 46,
                allocations: [
                    { address: REPRESENTATIVE_A, votes: '16' },
                    { address: REPRESENTATIVE_B, votes: '' },
                ],
            }),
        ).toBe(30);
    });
});

describe('getRepresentativeName and getRepresentativeApr', () => {
    it('resolves a representative published by the API', () => {
        expect(getRepresentativeName(REPRESENTATIVE_A, representatives)).toBe('P2P.org');
        expect(getRepresentativeApr(REPRESENTATIVE_A, representatives)).toBe(3.27);
    });

    it('is undefined for a custom address or while the list is not loaded', () => {
        expect(getRepresentativeName(CUSTOM_ADDRESS, representatives)).toBeUndefined();
        expect(getRepresentativeApr(CUSTOM_ADDRESS, representatives)).toBeUndefined();
        expect(getRepresentativeName(REPRESENTATIVE_A, undefined)).toBeUndefined();
    });
});

describe('getVotingDelegationAnalyticsValue', () => {
    it('reports published representatives by address and custom ones as the literal custom', () => {
        expect(
            getVotingDelegationAnalyticsValue(
                [
                    { address: REPRESENTATIVE_A, count: 16 },
                    { address: CUSTOM_ADDRESS, count: 15 },
                ],
                representatives,
            ),
        ).toBe(`${REPRESENTATIVE_A},custom`);
    });

    it('leaves out representatives without votes', () => {
        expect(
            getVotingDelegationAnalyticsValue(
                [
                    { address: REPRESENTATIVE_A, count: 16 },
                    { address: REPRESENTATIVE_B, count: 0 },
                ],
                representatives,
            ),
        ).toBe(REPRESENTATIVE_A);
    });
});

describe('getWeightedApr', () => {
    it('weights the APR by the votes assigned to each representative', () => {
        expect(
            getWeightedApr({
                allocations: [
                    { address: REPRESENTATIVE_A, count: 30 },
                    { address: REPRESENTATIVE_B, count: 10 },
                ],
                representatives,
            }),
        ).toBeCloseTo((3.27 * 30 + 3.28 * 10) / 40);
    });

    it('leaves custom representatives and zero votes out of the average', () => {
        expect(
            getWeightedApr({
                allocations: [
                    { address: REPRESENTATIVE_A, count: 16 },
                    { address: CUSTOM_ADDRESS, count: 30 },
                    { address: REPRESENTATIVE_B, count: 0 },
                ],
                representatives,
            }),
        ).toBe(3.27);
    });

    it('is undefined when no rewarded votes are assigned', () => {
        expect(
            getWeightedApr({
                allocations: [{ address: CUSTOM_ADDRESS, count: 30 }],
                representatives,
            }),
        ).toBeUndefined();
        expect(getWeightedApr({ allocations: [], representatives })).toBeUndefined();
    });
});

describe('applyRepresentativeSelection', () => {
    it('removes only the shown representatives the user unchecked', () => {
        expect(
            applyRepresentativeSelection({
                allocations: [
                    { address: REPRESENTATIVE_A, votes: '16' },
                    { address: REPRESENTATIVE_B, votes: '30' },
                ],
                shownAddresses: [REPRESENTATIVE_A, REPRESENTATIVE_B],
                selectedAddresses: [REPRESENTATIVE_B],
                totalVotes: 46,
            }),
        ).toEqual([{ address: REPRESENTATIVE_B, votes: '30' }]);
    });

    it('splits the unassigned votes evenly among the newly selected ones, appended in order', () => {
        expect(
            applyRepresentativeSelection({
                allocations: [{ address: REPRESENTATIVE_A, votes: '16' }],
                shownAddresses: [REPRESENTATIVE_A],
                selectedAddresses: [REPRESENTATIVE_B, REPRESENTATIVE_A, CUSTOM_ADDRESS],
                totalVotes: 46,
            }),
        ).toEqual([
            { address: REPRESENTATIVE_A, votes: '16' },
            { address: REPRESENTATIVE_B, votes: '15' },
            { address: CUSTOM_ADDRESS, votes: '15' },
        ]);
    });

    it('keeps an allocation that arrived while the modal was open and was never shown', () => {
        expect(
            applyRepresentativeSelection({
                allocations: [{ address: REPRESENTATIVE_A, votes: '16' }],
                shownAddresses: [],
                selectedAddresses: [REPRESENTATIVE_B],
                totalVotes: 46,
            }),
        ).toEqual([
            { address: REPRESENTATIVE_A, votes: '16' },
            { address: REPRESENTATIVE_B, votes: '30' },
        ]);
    });

    it('gives newly selected representatives nothing when no votes are left', () => {
        expect(
            applyRepresentativeSelection({
                allocations: [{ address: REPRESENTATIVE_A, votes: '46' }],
                shownAddresses: [REPRESENTATIVE_A],
                selectedAddresses: [REPRESENTATIVE_A, REPRESENTATIVE_B],
                totalVotes: 46,
            }),
        ).toEqual([
            { address: REPRESENTATIVE_A, votes: '46' },
            { address: REPRESENTATIVE_B, votes: '0' },
        ]);
    });
});

describe('applyVoteReassignment', () => {
    it('applies the edited counts and keeps rows the draft did not cover', () => {
        expect(
            applyVoteReassignment({
                allocations: [
                    { address: REPRESENTATIVE_A, votes: '16' },
                    { address: REPRESENTATIVE_B, votes: '30' },
                ],
                reassignedAllocations: [{ address: REPRESENTATIVE_B, votes: '20' }],
            }),
        ).toEqual([
            { address: REPRESENTATIVE_A, votes: '16' },
            { address: REPRESENTATIVE_B, votes: '20' },
        ]);
    });

    it('ignores draft rows for representatives no longer allocated', () => {
        expect(
            applyVoteReassignment({
                allocations: [{ address: REPRESENTATIVE_A, votes: '16' }],
                reassignedAllocations: [
                    { address: REPRESENTATIVE_A, votes: '10' },
                    { address: REPRESENTATIVE_B, votes: '6' },
                ],
            }),
        ).toEqual([{ address: REPRESENTATIVE_A, votes: '10' }]);
    });
});
