import { findSelfAddressIssue, findTronAddressIssue } from './address';
import {
    findSelfAddressIssueTestCases,
    findTronAddressIssueTestCases,
} from '../../../mocks/validation/tron/mockAddress';

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
