import {
    findSelfAddressIssueTestCases,
    findTronAddressIssueTestCases,
} from '../../../fixtures/validation/tron/address.fixture';
import { findSelfAddressIssue, findTronAddressIssue } from '../../../validation/tron/address';

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
