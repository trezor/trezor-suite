import React, { useEffect } from 'react';
import { useLocation } from 'react-router';

import Header from '../components/Header';
import Main from '../components/Main';
import Devices from '../components/Devices';
import * as routerActions from '../actions/routerActions';
import { useActions } from '../hooks';

const AppContainer: React.FC = ({ children }) => {
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
            <Devices />
            <Main>{children}</Main>
        </div>
    );
};

export default AppContainer;
