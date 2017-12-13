/* @flow */
'use strict';

import React from 'react';
import { Route } from 'react-router-dom';
import { 
    AppContainer,
    LoadingContainer,
    HistoryContainer,
    SendFormContainer,
    ReceiveContainer,
} from '../containers';

export default (
    <AppContainer>
        <Route exact path="/" component={ HistoryContainer } />
        <Route exact path="/address/:address" component={ HistoryContainer } />
        <Route path="/address/:address/send" component={ SendFormContainer } />
        <Route path="/address/:address/receive" component={ ReceiveContainer } />
    </AppContainer>
);