// avoid some unexpected re-renders in tests by disabling this hook logic
jest.mock('./hooks/general/useMountedRecentlyFlag', () => ({
    useMountedRecentlyFlag: () => false,
}));

jest.mock('./hooks/general/useFocusedValueWatch', () => ({
    useFocusedValueWatch: () => false,
}));
