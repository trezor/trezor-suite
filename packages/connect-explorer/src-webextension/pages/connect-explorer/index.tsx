import { createRoot } from 'react-dom/client';

import App from '../../../src/router/';

const container = document.getElementById('connect-explorer-container');
const root = createRoot(container!);
root.render(<App />);
