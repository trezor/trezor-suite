import { withOpenChat } from '../src/chat';

describe(withOpenChat.name, () => {
    test('appends #open-chat to URL without query params', () => {
        expect(withOpenChat('https://trezor.io/support')).toBe(
            'https://trezor.io/support#open-chat',
        );
    });

    test('inserts #open-chat after query params', () => {
        expect(withOpenChat('https://trezor.io/support?utm_medium=mobile')).toBe(
            'https://trezor.io/support?utm_medium=mobile#open-chat',
        );
    });

    test('works with URL without path', () => {
        expect(withOpenChat('https://trezor.io')).toBe('https://trezor.io#open-chat');
    });

    test('does not append #open-chat if already present', () => {
        expect(withOpenChat('https://trezor.io/support#open-chat')).toBe(
            'https://trezor.io/support#open-chat',
        );
    });

    test('replaces existing fragment with #open-chat', () => {
        expect(withOpenChat('https://trezor.io/support#section')).toBe(
            'https://trezor.io/support#open-chat',
        );
    });
});
