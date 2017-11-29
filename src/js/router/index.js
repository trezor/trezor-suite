/* @flow */
'use strict';

import React from 'react';
import { Route } from 'react-router-dom';
import { AppContainer, LoadingContainer, SendContainer } from '../containers';


export default (
    <AppContainer>
        <Route exact path="/" component={ LoadingContainer } />
        <Route path="/about" component={ SendContainer } />
    </AppContainer>
);