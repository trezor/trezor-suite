import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './router';

const root = document.getElementById('root');
if (root) {
    root.render(<App />);
}
