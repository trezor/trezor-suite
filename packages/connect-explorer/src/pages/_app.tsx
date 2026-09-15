import '../styles/globals.css';
import '@trezor/connect-explorer-theme/style.css';

import { createConnectExplorerCompositionRoot } from '../support/createConnectExplorerCompositionRoot';

const { app } = createConnectExplorerCompositionRoot();
const App = app();

export default App;
