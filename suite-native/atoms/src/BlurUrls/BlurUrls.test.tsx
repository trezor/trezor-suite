import { PixelRatio, Platform, StyleSheet } from 'react-native';

import { fireEvent, renderWithBasicProvider, screen } from '@suite-native/test-utils';

import { BlurUrls } from './BlurUrls';

type UrlCase = [text: string, label: string, urls: string[]];

const pressEvent = { stopPropagation: () => undefined };

describe('BlurUrls', () => {
    afterEach(() => jest.restoreAllMocks());

    it('preserves an ordinary token name and its truncation props', async () => {
        await renderWithBasicProvider(
            <BlurUrls text="Ordinary Token" numberOfLines={1} ellipsizeMode="tail" />,
        );

        expect(screen.getByText('Ordinary Token')).toHaveProp('numberOfLines', 1);
    });

    it('reveals on tap, masks on a second tap and keeps a different token masked', async () => {
        const { rerender } = await renderWithBasicProvider(
            <BlurUrls text="Claim at rewards.example now" />,
        );

        expect(screen.getByText('rewards.example')).toHaveStyle({
            color: '#ffffff00',
            textShadowRadius: 3,
        });

        await fireEvent.press(screen.getByText('rewards.example'), pressEvent);
        expect(screen.getByLabelText('Claim at rewards.example now')).toBeOnTheScreen();
        expect(screen.getByText('rewards.example')).toHaveStyle({ textShadowRadius: 1 });

        await fireEvent.press(screen.getByText('rewards.example'), pressEvent);
        expect(screen.getByLabelText('Claim at … now')).toBeOnTheScreen();
        expect(screen.getByText('rewards.example')).toHaveStyle({ textShadowRadius: 3 });

        await fireEvent.press(screen.getByText('rewards.example'), pressEvent);
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

    it('reveals and masks each URL independently', async () => {
        await renderWithBasicProvider(<BlurUrls text="Visit first.example or second.example!" />);

        await fireEvent.press(screen.getByText('first.example'), pressEvent);
        expect(screen.getByLabelText('Visit first.example or …!')).toBeOnTheScreen();
        expect(screen.getByText('first.example')).toHaveStyle({ textShadowRadius: 1 });
        expect(screen.getByText('second.example')).toHaveStyle({ textShadowRadius: 3 });

        await fireEvent.press(screen.getByText('second.example'), pressEvent);
        expect(screen.getByLabelText('Visit first.example or second.example!')).toBeOnTheScreen();

        await fireEvent.press(screen.getByText('first.example'), pressEvent);
        expect(screen.getByLabelText('Visit … or second.example!')).toBeOnTheScreen();
        expect(screen.getByText('second.example')).toHaveStyle({ textShadowRadius: 1 });
    });

    it('exposes separate screen-reader actions for multiple URLs', async () => {
        await renderWithBasicProvider(<BlurUrls text="Visit first.example or second.example!" />);

        await fireEvent(screen.getByLabelText('Visit … or …!'), 'accessibilityAction', {
            nativeEvent: { actionName: 'toggle-url-1' },
        });

        expect(screen.getByLabelText('Visit … or second.example!')).toBeOnTheScreen();
    });

    it('matches desktop Gaussian blur strength on a high-density Android screen', async () => {
        jest.replaceProperty(Platform, 'OS', 'android');
        jest.spyOn(PixelRatio, 'get').mockReturnValue(3.5);
        await renderWithBasicProvider(<BlurUrls text="rewards.example" />);

        const maskedRadius = StyleSheet.flatten(
            screen.getByText('rewards.example').props.style,
        ).textShadowRadius;
        expect(maskedRadius * 0.57735 + 0.5).toBeCloseTo(10.5);

        await fireEvent.press(screen.getByText('rewards.example'), pressEvent);
        const revealedRadius = StyleSheet.flatten(
            screen.getByText('rewards.example').props.style,
        ).textShadowRadius;
        expect(revealedRadius * 0.57735 + 0.5).toBeCloseTo(3.5);
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
            expect(screen.getByText(url)).toHaveStyle({
                color: '#ffffff00',
                textShadowRadius: 3,
            });
        }
    });
});
