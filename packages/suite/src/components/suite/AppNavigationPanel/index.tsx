import React, { createContext } from 'react';
import { useInView } from 'react-intersection-observer';

import AppNavigationPanelInner from './components/AppNavigationPanelInner';

type AppNavigationPanelCtxProps = {
    children?: React.ReactNode;
    inView: boolean;
};

const AppNavigationPanelCtx = createContext(true);

const AppNavigationPanelProvider = ({ children, inView }: AppNavigationPanelCtxProps) => (
    <AppNavigationPanelCtx.Provider value={inView}>{children}</AppNavigationPanelCtx.Provider>
);

interface Props {
    title: React.ReactNode;
    ticker?: React.ReactNode;
    dropdown?: React.ReactNode;
    maxWidth: 'small' | 'default';
    children?: React.ReactNode;
    navigation?: React.ReactNode;
}

export const useInViewProp = () => React.useContext(AppNavigationPanelCtx);

const AppNavigationPanel = (props: Props) => {
    const { ref, inView } = useInView({
        delay: 100,
        initialInView: false,
    });

    return (
        <AppNavigationPanelInner
            refer={ref}
            title={props.title}
            ticker={props.ticker}
            dropdown={props.dropdown}
            maxWidth={props.maxWidth}
            navigation={
                <AppNavigationPanelProvider inView={inView}>
                    {props.navigation}
                </AppNavigationPanelProvider>
            }
        >
            {props.children}
        </AppNavigationPanelInner>
    );
};

export default AppNavigationPanel;
