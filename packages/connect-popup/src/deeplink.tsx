import React from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary } from '@trezor/connect-ui/src/support/ErrorBoundary';
import { GlobalStyle } from '@trezor/connect-ui/src/support/GlobalStyle';
import { InfoPanel } from '@trezor/connect-ui/src/components/InfoPanel';
import { View } from '@trezor/connect-ui/src/components/View';
import { Button, Paragraph, intermediaryTheme } from '@trezor/components';

interface ReactWrapperProps {
    children: React.ReactNode;
}

const ThemeWrapper = ({ children }: ReactWrapperProps) => (
    <ThemeProvider theme={intermediaryTheme.light}>{children}</ThemeProvider>
);

const Layout = styled.div`
    display: flex;
    flex: 1;
    height: 100%;

    @media (max-width: 639px) {
        flex-direction: column;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledP = styled(Paragraph)`
    margin: 0 20%;
    color: #757575;
`;

const DeeplinkFallback = () => {
    return (
        <>
            <View
                title="Download Mobile App"
                data-testid="@connect-deeplink"
                buttons={
                    <>
                        <Button variant="primary" onClick={() => window.close()}>
                            Close
                        </Button>
                    </>
                }
            >
                <StyledP>
                    You have opened a deep link to the Trezor Connect mobile application. Please
                    install the application from{' '}
                    <a href="https://play.google.com/store/apps/details?id=io.trezor.suite">
                        Google Play
                    </a>
                    {' or '}
                    <a href="https://apps.apple.com/app/id1631884497">App Store</a>.
                </StyledP>
            </View>
        </>
    );
};

const App = () => (
    <ErrorBoundary>
        <GlobalStyle />
        <ThemeWrapper>
            <Layout>
                <InfoPanel method="Trezor Connect Deep Link" origin={window.origin} />
                <DeeplinkFallback />
            </Layout>
        </ThemeWrapper>
    </ErrorBoundary>
);

const renderUI = () => {
    const deeplinkReact = document.getElementById('deeplink-react');
    deeplinkReact!.style.height = '100%';
    const root = createRoot(deeplinkReact!);
    const Component = <App />;
    console.log('renderUI', deeplinkReact);

    root.render(Component);
};

renderUI();
