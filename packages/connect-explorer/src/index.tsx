import React from 'react';
import { render } from 'react-dom';
import App from './router';

const root = document.getElementById('root');
if (root) {
    render(<App />, root);
}
