import { Text } from 'react-native';

import { Feature } from '@suite-common/message-system';
import { mockMessageSystemStateWithFeatureFlags } from '@suite-common/message-system/mocks';
import { type Localization } from '@suite-common/suite-types';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { TradingRestrictedGuard } from './TradingRestrictedGuard';

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({ goBack: jest.fn(), canGoBack: () => true }),
    useRoute: () => ({ name: 'TradingHistory' }),
}));

const RESTRICTED_CONTENT: Localization = {
    en: 'Restricted by message',
    es: '',
    cs: '',
    de: '',
    fr: '',
    pt: '',
};

type RenderGuardParams = {
    isFinpromRestricted: boolean;
    content?: Localization;
};

const renderGuard = ({ isFinpromRestricted, content }: RenderGuardParams) =>
    renderWithStoreProvider(
        <TradingRestrictedGuard>
            <Text>trading screen</Text>
        </TradingRestrictedGuard>,
        {
            preloadedState: {
                messageSystem: mockMessageSystemStateWithFeatureFlags(
                    { [Feature.finprom.presenceRestriction]: isFinpromRestricted },
                    { [Feature.finprom.presenceRestriction]: { countries: ['US'] } },
                    content,
                ),
            },
        },
    );

describe('TradingRestrictedGuard', () => {
    it('shows the message content instead of the trading screen when restricted', async () => {
        const { getByText, queryByText } = await renderGuard({
            isFinpromRestricted: true,
            content: RESTRICTED_CONTENT,
        });

        expect(getByText('Restricted by message')).toBeOnTheScreen();
        expect(queryByText('trading screen')).toBeNull();
    });

    it('falls back to the built-in text when the message has no content', async () => {
        const { getByText, queryByText } = await renderGuard({ isFinpromRestricted: true });

        expect(getByText(getTranslation('tradingAtoms.error.restrictedTitle'))).toBeOnTheScreen();
        expect(queryByText('trading screen')).toBeNull();
    });

    it('shows the trading screen when not restricted', async () => {
        const { getByText } = await renderGuard({ isFinpromRestricted: false });

        expect(getByText('trading screen')).toBeOnTheScreen();
    });
});
