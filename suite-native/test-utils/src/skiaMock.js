jest.mock('@shopify/react-native-skia', () => {
    return {
        // Mock komponenty jako View
        Canvas: 'Canvas',
        Circle: 'Circle',
        Group: 'Group',
        Path: 'Path',
        Rect: 'Rect',
        RoundedRect: 'RoundedRect',
        Line: 'Line',
        Text: 'Text',
        Image: 'Image',
        Fill: 'Fill',
        LinearGradient: 'LinearGradient',
        RadialGradient: 'RadialGradient',
        Blur: 'Blur',
        Shadow: 'Shadow',

        // Mock Skia API
        Skia: {
            Path: {
                Make: jest.fn(() => ({
                    moveTo: jest.fn(),
                    lineTo: jest.fn(),
                    close: jest.fn(),
                })),
            },
        },

        // Mock hooks
        useValue: jest.fn(val => ({ current: val })),
        useTouchHandler: jest.fn(() => ({})),
        useFont: jest.fn(() => null),
        useImage: jest.fn(() => null),

        vec: (x, y) => ({ x, y }),
    };
});
