import './suite-common/test-utils/src/jsdomGlobalPolyfills';

// Legacy wallet-config exports are evaluated during imports, before individual tests create stores.
// Reuse an application root with the lightweight Connect client until those consumers use DI.
import { createConnectExplorerCompositionRoot } from './packages/connect-explorer/src/createConnectExplorerCompositionRoot';

createConnectExplorerCompositionRoot();
