import { useCallback, useState } from 'react';
import { runOnJS } from 'react-native-reanimated';
import { Frame, useFrameProcessor } from 'react-native-vision-camera';

/* global __scanQRCodes */
export const scanQRCodes = (frame: Frame): string[] | null => {
    'worklet';

    // @ts-ignore
    return __scanQRCodes(frame);
};

export const useXPubScanner = () => {
    const [barcodes, setBarcodes] = useState<string[]>([]);

    const handleCallback = useCallback(
        (codes: string[] | null) => {
            if (!codes || codes.length === 0) return;
            setBarcodes(codes);
        },
        [setBarcodes],
    );

    const frameProcessor = useFrameProcessor(frame => {
        'worklet';

        const qrCodes = scanQRCodes(frame);
        runOnJS(handleCallback)(qrCodes);
    }, []);

    return { frameProcessor, barcodes };
};
