/* @flow */

// Just testing that the classes are actually the correct types
import type {Transport} from '../transport';

import BridgeTransport from '../bridge';
import ExtensionTransport from '../extension';
import ParallelTransport from '../parallel';
import FallbackTransport from '../fallback';
import LowlevelTransport from '../lowlevel';
import LowlevelTransportWithSharedConnections from '../lowlevel/withSharedConnections';
import ChromeHidPlugin from '../lowlevel/chrome-hid';
import ChromeUdpPlugin from '../lowlevel/chrome-udp';
import NodeHidPlugin from '../lowlevel/node-hid';
import WebUsbPlugin from '../lowlevel/webusb';

function acceptsTransport(t: Transport) {}

acceptsTransport(new BridgeTransport());
acceptsTransport(new ExtensionTransport());
acceptsTransport(new ParallelTransport({"a": new BridgeTransport()}));
acceptsTransport(new FallbackTransport([new BridgeTransport()]));

acceptsTransport(new LowlevelTransport(new ChromeHidPlugin()));
acceptsTransport(new LowlevelTransport(new ChromeUdpPlugin()));
acceptsTransport(new LowlevelTransport(new NodeHidPlugin()));

acceptsTransport(new LowlevelTransportWithSharedConnections(new WebUsbPlugin(), () => new SharedWorker(`bla`)));
