import React from 'react';

import ReactDOM from 'react-dom/client';

import { AnalyticsTestingServer } from './AnalyticsTestingServer';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
    <React.StrictMode>
        <AnalyticsTestingServer />
    </React.StrictMode>,
);
