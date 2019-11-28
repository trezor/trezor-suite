/* @flow */

// Just testing that the classes are actually the correct types
import type {Transport} from '../transport';

import BridgeTransport2 from '../bridge/v2';
import FallbackTransport from '../fallback';
import LowlevelTransportWithSharedConnections from '../lowlevel/withSharedConnections';
import WebUsbPlugin from '../lowlevel/webusb';

function acceptsTransport(t: Transport) {}

acceptsTransport(new BridgeTransport2());
acceptsTransport(new FallbackTransport([new BridgeTransport2()]));

acceptsTransport(new LowlevelTransportWithSharedConnections(new WebUsbPlugin(), () => new SharedWorker(`bla`)));
