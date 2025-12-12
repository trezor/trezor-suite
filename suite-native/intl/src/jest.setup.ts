import { messages as mockMessages } from './messages';

// Do not import those big message files in every test. We use EN only anyway.
jest.mock('./hooks/useTranslatedMessages', () => ({
    useTranslatedMessages: () => mockMessages,
}));
