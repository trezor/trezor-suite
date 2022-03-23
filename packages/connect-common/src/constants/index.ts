import * as BLOCKCHAIN from './blockchain';
import * as DEVICE from './device';
import * as ERRORS from './errors';
import * as IFRAME from './iframe';
import * as NETWORK from './network';
import * as POPUP from './popup';
import * as TRANSPORT from './transport';
import * as UI from './ui';
import * as CARDANO from './cardano';

export const CORE_EVENT = 'CORE_EVENT';
export const UI_EVENT = 'UI_EVENT';
export const DEVICE_EVENT = 'DEVICE_EVENT';
export const TRANSPORT_EVENT = 'TRANSPORT_EVENT';
export const RESPONSE_EVENT = 'RESPONSE_EVENT';
export const BLOCKCHAIN_EVENT = 'BLOCKCHAIN_EVENT';

export { BLOCKCHAIN, DEVICE, ERRORS, IFRAME, NETWORK, POPUP, TRANSPORT, UI, CARDANO };
