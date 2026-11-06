import { Pressable } from 'react-native';

import { fireEvent, renderWithBasicProvider, screen } from '@suite-native/test-utils';
import { mock } from '@trezor/dependency-injection';

import { Text } from '../Text';
import { BlurUrls } from './BlurUrls';

type UrlCase = [text: string, label: string, urls: string[]];

describe('BlurUrls', () => {
    it('preserves an ordinary token name and its truncation props', async () => {
        await renderWithBasicProvider(
            <BlurUrls text="Ordinary Token" numberOfLines={1} ellipsizeMode="tail" />,
        );

        expect(screen.getByText('Ordinary Token')).toHaveProp('numberOfLines', 1);
    });

    it('keeps URLs masked while allowing the parent row to handle presses', async () => {
        const onPress = mock<() => void>();
        await renderWithBasicProvider(
            <Pressable onPress={onPress}>
                <BlurUrls text="Claim at rewards.example now" />
            </Pressable>,
        );

        await fireEvent.press(screen.getByLabelText('Claim at … now'));

        expect(onPress).toHaveBeenCalledTimes(1);
        expect(screen.getByLabelText('Claim at … now')).toBeOnTheScreen();
        expect(screen.queryByText('rewards.example')).toBeNull();
        expect(screen.getByLabelText('Claim at … now')).not.toHaveProp('accessibilityActions');
    });

    it.each(['rewards.example', 'rewards.example...'])(
        'keeps the standalone label %s masked without intercepting row presses',
        async text => {
            const onPress = mock<() => void>();
            await renderWithBasicProvider(
                <Pressable onPress={onPress}>
                    <BlurUrls text={text} numberOfLines={1} />
                </Pressable>,
            );

            const label = screen.getByLabelText(text.endsWith('...') ? '…...' : '…');
            await fireEvent.press(label);

            expect(onPress).toHaveBeenCalledTimes(1);
            expect(screen.queryByText('rewards.example')).toBeNull();
            expect(
                screen.getByText('rewards.example', { includeHiddenElements: true }),
            ).toBeOnTheScreen();
            expect(label).toHaveProp('numberOfLines', 1);
        },
    );

    it('keeps an embedded URL in the native text flow', async () => {
        await renderWithBasicProvider(
            <Text>
                {'Send '}
                <BlurUrls text="rewards.example" />
                {' on Ethereum'}
            </Text>,
        );

        expect(screen.queryByTestId('blur-native', { includeHiddenElements: true })).toBeNull();
        expect(screen.queryByText('rewards.example')).toBeNull();
        expect(screen.getByLabelText('…')).toBeOnTheScreen();
    });

    it.each<UrlCase>([
        ['Claim at rewards.example now', 'Claim at … now', ['rewards.example']],
        ['rewards.example Claim now', '… Claim now', ['rewards.example']],
        ['rewards.example', '…', ['rewards.example']],
        [
            'Visit first.example or second.example!',
            'Visit … or …!',
            ['first.example', 'second.example'],
        ],
        ['ᴄʟᴀɪᴍ👉ᴡᴡᴡ.ᴡɪɴᴘʜᴀɴᴛᴏᴍ.ᴄᴏᴍ', 'ᴄʟᴀɪᴍ👉…', ['ᴡᴡᴡ.ᴡɪɴᴘʜᴀɴᴛᴏᴍ.ᴄᴏᴍ']],
    ])('masks URL parts of %s in their original order', async (text, label, urls) => {
        await renderWithBasicProvider(<BlurUrls text={text} />);

        expect(screen.getByLabelText(label)).toBeOnTheScreen();
        for (const url of urls) {
            expect(screen.queryByText(url)).toBeNull();
            expect(screen.getByText(url, { includeHiddenElements: true })).toBeOnTheScreen();
        }
    });
});
