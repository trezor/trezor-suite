// eslint-disable-next-line local-rules/no-package-deep-imports
import { renderWithStoreProviderAsync } from '@suite-native/test-utils/store';

import { LegalGatewayContextMessage } from '../LegalGatewayContextMessage';

jest.mock('@suite-common/message-system', () => {
    const messages: Record<string, unknown> = {
        'legal.gateway': { content: 'Legal gateway message' },
    };

    return {
        ...jest.requireActual('@suite-common/message-system'),
        selectContextMessageContent: (_: unknown, context: string) => messages[context],
    };
});

describe('LegalGatewayContextMessage', () => {
    const renderLegalGatewayContextMessage = () =>
        renderWithStoreProviderAsync(<LegalGatewayContextMessage />);

    it('should render legal.gateway context message', async () => {
        const { getByText } = await renderLegalGatewayContextMessage();

        expect(getByText('Legal gateway message')).toBeOnTheScreen();
    });
});
