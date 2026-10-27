import { renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { BlurUrls } from './BlurUrls';
import { Box as MockBox } from '../Box';

type UrlCase = [text: string, label: string, urls: string[]];

jest.mock('./BlurredUrl', () => ({
    BlurredUrl: ({ text }: { text: string }) => (
        <MockBox testID="blurred-url" accessibilityLabel={text} />
    ),
}));

describe('BlurUrls', () => {
    it('preserves an ordinary token name and its truncation props', async () => {
        await renderWithBasicProvider(
            <BlurUrls text="Ordinary Token" numberOfLines={1} ellipsizeMode="tail" />,
        );

        expect(screen.getByText('Ordinary Token')).toHaveProp('numberOfLines', 1);
        expect(screen.queryByTestId('blurred-url')).toBeNull();
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
        expect(
            screen.getAllByTestId('blurred-url').map(element => element.props.accessibilityLabel),
        ).toEqual(urls);
        for (const url of urls) {
            expect(screen.queryByText(url, { exact: false })).toBeNull();
        }
    });
});
