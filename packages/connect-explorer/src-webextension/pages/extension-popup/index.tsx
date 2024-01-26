import { createRoot } from 'react-dom/client';

import { ExtensionPopup } from './ExtensionPopup';

const container = document.getElementById('extension-popup-container');
const root = createRoot(container!);
root.render(<ExtensionPopup />);
