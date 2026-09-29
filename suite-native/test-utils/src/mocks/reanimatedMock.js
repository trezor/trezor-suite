jest.mock('react-native-reanimated', () => ({
    ...require('react-native-reanimated/mock'),
    useReducedMotion: jest.fn(() => false),
}));
