/* @flow */

// Just testing that the classes are actually the correct types
import type {Transport} from '../transport';

import BridgeTransport from '../bridge';
import ExtensionTransport from '../extension';
import ParallelTransport from '../parallel';
import FallbackTransport from '../fallback';
import LowlevelTransportWithSharedConnections from '../lowlevel/withSharedConnections';
import WebUsbPlugin from '../lowlevel/webusb';

function acceptsTransport(t: Transport) {}

acceptsTransport(new BridgeTransport());
acceptsTransport(new ExtensionTransport());
acceptsTransport(new ParallelTransport({"a": new BridgeTransport()}));
acceptsTransport(new FallbackTransport([new BridgeTransport()]));

acceptsTransport(new LowlevelTransportWithSharedConnections(new WebUsbPlugin(), () => new SharedWorker(`bla`)));
