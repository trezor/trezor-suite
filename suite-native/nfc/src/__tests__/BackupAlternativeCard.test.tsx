import { renderWithBasicProvider, userEvent } from '@suite-native/test-utils';

import { BackupAlternativeCard } from '../BackupAlternativeCard';

describe('BackupAlternativeCard', () => {
    const defaultProps = {
        badgeLabel: 'moduleNfcOnboarding.noNfcTags.finishSetup.badge' as const,
        title: 'moduleNfcOnboarding.noNfcTags.finishSetup.title' as const,
        description: 'moduleNfcOnboarding.noNfcTags.finishSetup.description' as const,
        buttonLabel: 'moduleNfcOnboarding.noNfcTags.finishSetup.button' as const,
        onPress: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders badge, title, description, and button', () => {
        const { getByTestId } = renderWithBasicProvider(
            <BackupAlternativeCard {...defaultProps} />,
        );

        expect(getByTestId('@backup-alternative-card')).toBeDefined();
        expect(getByTestId('@backup-alternative-card/badge')).toBeDefined();
        expect(getByTestId('@backup-alternative-card/title')).toBeDefined();
        expect(getByTestId('@backup-alternative-card/description')).toBeDefined();
        expect(getByTestId('@backup-alternative-card/button')).toBeDefined();
    });

    it('calls onPress when button is pressed', async () => {
        const { getByTestId } = renderWithBasicProvider(
            <BackupAlternativeCard {...defaultProps} />,
        );

        await userEvent.press(getByTestId('@backup-alternative-card/button'));

        expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
    });
});
