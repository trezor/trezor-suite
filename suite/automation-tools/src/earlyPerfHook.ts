import { installEarlyPerfHook } from './installEarlyPerfHook';

// First webpack entry item, so it runs before react-dom looks for the DevTools hook.
installEarlyPerfHook();
