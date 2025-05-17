import React from 'react';
import { View } from 'react-native';

const MockWebView = <View testID="mocked-webview">Mocked WebView</View>;

jest.mock('react-native-webview', () => ({
    WebView: () => MockWebView,
}));

// avoid some unexpected re-renders in tests by disabling this hook logic
jest.mock('./hooks/general/useMountedRecentlyFlag', () => ({
    useMountedRecentlyFlag: () => false,
}));
