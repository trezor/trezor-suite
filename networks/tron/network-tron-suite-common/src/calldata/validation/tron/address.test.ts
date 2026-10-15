import {
    findSelfAddressIssueTestCases,
    findTronAddressIssueTestCases,
} from './__fixtures__/address.fixture';
import { findSelfAddressIssue, findTronAddressIssue } from './address';

describe('findTronAddressIssue', () => {
    it.each(findTronAddressIssueTestCases)('$description', ({ input, expected }) => {
        expect(findTronAddressIssue(input)).toBe(expected);
    });
});

describe('findSelfAddressIssue', () => {
    it.each(findSelfAddressIssueTestCases)('$description', ({ input, context, expected }) => {
        expect(findSelfAddressIssue(input, context)).toBe(expected);
    });
});
