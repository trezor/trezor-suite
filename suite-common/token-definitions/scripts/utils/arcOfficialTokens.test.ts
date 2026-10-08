import { getArcOfficialTokens } from './arcOfficialTokens';

describe(getArcOfficialTokens.name, () => {
    // Suite lowercases an EVM contract before the lookup, so a checksummed address would never match.
    it('should list lowercase addresses', () => {
        getArcOfficialTokens().forEach(address => expect(address).toMatch(/^0x[0-9a-f]{40}$/));
    });
});
