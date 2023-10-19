import { createRoot } from 'react-dom/client';
import App from './router';

const container = document.getElementById('root');
const root = createRoot(container!);
if (root) {
    root.render(<App />);
}
