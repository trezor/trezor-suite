import { installEarlyPerfHook } from './installEarlyPerfHook';

// The first item of the web and desktop renderer webpack entries, so it runs before react-dom
// evaluates and probes `__REACT_DEVTOOLS_GLOBAL_HOOK__`.
installEarlyPerfHook();
