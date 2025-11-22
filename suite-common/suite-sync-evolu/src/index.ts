/**
 * IMPORTANT: Do not export internal Evolu-Stuff out of this.
 *
 * We shall NOT leak Evolu implementation details.
 */

export { createEvoluInstance } from './createEvoluInstance';
export { EvoluStorage } from './evoluStorage';

// Todo: this shall not be exported, this is kinda hack (we miss abstraction for this)
export { createEvoluAppOwnerFromTrezorData } from './createEvoluAppOwnerFromTrezorData';
