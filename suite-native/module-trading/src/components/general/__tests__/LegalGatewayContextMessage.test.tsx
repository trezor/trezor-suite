import { renderWithStoreProvider } from '@suite-native/test-utils';

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
        renderWithStoreProvider(<LegalGatewayContextMessage />);

    it('should render legal.gateway context message', () => {
        const { getByText } = renderLegalGatewayContextMessage();

        expect(getByText('Legal gateway message')).toBeOnTheScreen();
    });
});
