import { TestCategory, TestPriority } from '../../support/testAnnotations';
import { it } from '../../support/testMetadata';

describe('Settings', () => {
    it('Change currency', {
        testCase: 'Change currency in settings',
        prerequisites: ['Suite lite app with an Bitcoin account already imported'],
        steps: [
            'On bottom bar, click on "Settings gear" icon',
            'Click on "Localization"',
            'Change fiat "currency"',
            'Navigate to "Home" section',
            'Price of imported accounts changed accordingly'
        ],
        category: TestCategory.Settings,
        priority: TestPriority.Medium,
    }, async () => {});
});
