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
    isRegionRestricted: boolean;
    content?: Localization;
};

const renderGuard = ({ isRegionRestricted, content }: RenderGuardParams) =>
    renderWithStoreProvider(
        <TradingRestrictedGuard>
            <Text>trading screen</Text>
        </TradingRestrictedGuard>,
        {
            preloadedState: {
                messageSystem: mockMessageSystemStateWithFeatureFlags(
                    { [Feature.regions.presenceRestriction]: isRegionRestricted },
                    { [Feature.regions.presenceRestriction]: { countries: ['US'] } },
                    content,
                ),
            },
        },
    );

describe('TradingRestrictedGuard', () => {
    it('shows the message content instead of the trading screen when restricted', async () => {
        const { getByText, queryByText } = await renderGuard({
            isRegionRestricted: true,
            content: RESTRICTED_CONTENT,
        });

        expect(getByText('Restricted by message')).toBeOnTheScreen();
        expect(queryByText('trading screen')).toBeNull();
    });

    it('falls back to the built-in text when the message has no content', async () => {
        const { getByText, queryByText } = await renderGuard({ isRegionRestricted: true });

        expect(getByText(getTranslation('tradingAtoms.error.restrictedTitle'))).toBeOnTheScreen();
        expect(queryByText('trading screen')).toBeNull();
    });

    it('shows the trading screen when not restricted', async () => {
        const { getByText } = await renderGuard({ isRegionRestricted: false });

        expect(getByText('trading screen')).toBeOnTheScreen();
    });
});
