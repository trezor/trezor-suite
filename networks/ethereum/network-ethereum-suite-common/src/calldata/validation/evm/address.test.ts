import {
    findAddressIssueTestCases,
    findSelfAddressIssueTestCases,
    findSenderMismatchIssueTestCases,
    findWhitelistIssueTestCases,
    findZeroAddressIssueTestCases,
} from './__fixtures__/address.fixture';
import {
    findAddressIssue,
    findSelfAddressIssue,
    findSenderMismatchIssue,
    findWhitelistIssue,
    findZeroAddressIssue,
} from './address';

describe('findAddressIssue', () => {
    it.each(findAddressIssueTestCases)('$description', ({ input, expected }) => {
        expect(findAddressIssue(input)).toBe(expected);
    });
});

describe('findZeroAddressIssue', () => {
    it.each(findZeroAddressIssueTestCases)('$description', ({ input, expected }) => {
        expect(findZeroAddressIssue(input)).toBe(expected);
    });
});

describe('findSelfAddressIssue', () => {
    it.each(findSelfAddressIssueTestCases)('$description', ({ input, context, expected }) => {
        expect(findSelfAddressIssue(input, context)).toBe(expected);
    });
});

describe('findSenderMismatchIssue', () => {
    it.each(findSenderMismatchIssueTestCases)('$description', ({ input, context, expected }) => {
        expect(findSenderMismatchIssue(input, context)).toBe(expected);
    });
});

describe('findWhitelistIssue', () => {
    it.each(findWhitelistIssueTestCases)('$description', ({ input, context, expected }) => {
        expect(findWhitelistIssue(input, context)).toBe(expected);
    });
});
