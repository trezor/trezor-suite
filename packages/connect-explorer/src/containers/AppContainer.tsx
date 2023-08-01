import React, { useEffect } from 'react';
import { useLocation } from 'react-router';

import Header from '../components/Header';
import { Main } from '../components/Main';
import * as routerActions from '../actions/routerActions';
import { useActions } from '../hooks';

interface AppContainerProps {
    children: React.ReactNode;
}

const AppContainer = ({ children }: AppContainerProps) => {
    const actions = useActions({
        ...routerActions,
    });
    const location = useLocation();

    useEffect(() => {
        actions.onLocationChange({ pathname: location.pathname, search: location.search });
    }, [location, actions]);

    return (
        <div className="app-container">
            <Header />
            <Main>{children}</Main>
        </div>
    );
};

export default AppContainer;
