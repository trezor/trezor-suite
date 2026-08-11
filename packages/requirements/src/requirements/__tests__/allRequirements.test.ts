import { requirements } from '../allRequirements';

describe('allRequirements', () => {
    it('includes the EAS workspace upload requirement', () => {
        expect(requirements.map(requirement => requirement.name)).toContain('eas-workspace-upload');
    });
});
