import { type SkImage, type makeImageFromView } from '@shopify/react-native-skia';

import { act, fireEvent, renderWithBasicProvider, waitFor } from '@suite-native/test-utils';

import { Text } from '../Text';
import { BlurredContent } from './BlurredContent';

const layout = { nativeEvent: { layout: { x: 0, y: 0, width: 100, height: 24 } } };

describe('BlurredContent', () => {
    it('keeps content concealed when capturing it fails', async () => {
        let captureAttempted = false;
        let rejectCapture: (reason: Error) => void = () => {};
        const capture = new Promise<SkImage>((_, reject) => {
            rejectCapture = reject;
        });
        const captureView: typeof makeImageFromView = () => {
            captureAttempted = true;

            return capture;
        };
        const { getByText, getByTestId, queryByText } = await renderWithBasicProvider(
            <BlurredContent isBlurred blurIntensity={4} captureView={captureView}>
                <Text>### BTC</Text>
            </BlurredContent>,
        );

        fireEvent(
            getByTestId('discreet-content', { includeHiddenElements: true }),
            'layout',
            layout,
        );

        await waitFor(() => expect(captureAttempted).toBe(true));
        await act(async () => {
            rejectCapture(new Error('Capture failed'));
            await capture.catch(() => {});
        });
        expect(queryByText('### BTC')).toBeNull();
        expect(getByText('### BTC', { includeHiddenElements: true })).not.toBeVisible();
    });

    it('renders public content without capturing it', async () => {
        const captureView: typeof makeImageFromView = () => {
            throw new Error('Public content must not be captured');
        };
        const { getByText, getByTestId } = await renderWithBasicProvider(
            <BlurredContent isBlurred={false} blurIntensity={4} captureView={captureView}>
                <Text>123 BTC</Text>
            </BlurredContent>,
        );

        fireEvent(getByTestId('discreet-content'), 'layout', layout);

        expect(getByText('123 BTC')).toBeVisible();
    });
});
