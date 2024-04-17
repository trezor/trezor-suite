import React from 'react';

import ReactDOM from 'react-dom/client';

import { App } from './App';
import { Status } from './pages/Status';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
    <React.StrictMode>
        <App>
            <Status />
        </App>
    </React.StrictMode>,
);

global.React = React;
