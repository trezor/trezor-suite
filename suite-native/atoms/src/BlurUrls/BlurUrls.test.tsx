import { fireEvent, renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { BlurUrls } from './BlurUrls';
import { PressableOpacity as MockPressableOpacity } from '../Pressable';

type UrlCase = [text: string, label: string, urls: string[]];
type MockBlurredUrlProps = {
    text: string;
    onToggle: () => void;
};

jest.mock('./BlurredUrl', () => ({
    BlurredUrl: ({ text, onToggle }: MockBlurredUrlProps) => (
        <MockPressableOpacity testID="blurred-url" accessibilityLabel={text} onPress={onToggle} />
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

    it('reveals on tap, masks on a second tap and keeps a different token masked', async () => {
        const { rerender } = await renderWithBasicProvider(
            <BlurUrls text="Claim at rewards.example now" />,
        );

        await fireEvent.press(screen.getByTestId('blurred-url'));
        expect(screen.getByLabelText('Claim at rewards.example now')).toBeOnTheScreen();

        await fireEvent.press(screen.getByTestId('blurred-url'));
        expect(screen.getByLabelText('Claim at … now')).toBeOnTheScreen();

        await fireEvent.press(screen.getByTestId('blurred-url'));
        await rerender(<BlurUrls text="Visit other.example" />);
        expect(screen.getByLabelText('Visit …')).toBeOnTheScreen();
    });

    it('lets a screen reader activate the masked text', async () => {
        await renderWithBasicProvider(<BlurUrls text="Claim at rewards.example now" />);

        await fireEvent(screen.getByLabelText('Claim at … now'), 'accessibilityAction', {
            nativeEvent: { actionName: 'activate' },
        });

        expect(screen.getByLabelText('Claim at rewards.example now')).toBeOnTheScreen();
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
