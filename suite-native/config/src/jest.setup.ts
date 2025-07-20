jest.mock('react-native-launch-arguments', () => ({
    LaunchArguments: {
        value: jest.fn(() => ({})),
    },
}));
