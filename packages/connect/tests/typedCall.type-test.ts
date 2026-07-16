// Type-level regression test for the wire-direction strictness of `typedCall` (see #5298).
//
// `typedCall` must accept only host -> device requests (`WireInMessage`) and only device -> host
// expected responses (`WireOutMessage`). This is enforced purely at the type level; the actual
// encode/decode is string-keyed and direction-agnostic.
//
// This file is part of `type-check` (tsc --build) but is NOT run by jest (no `spec`/`test`
// filename suffix). It exercises the real call-site chain — `DeviceCommands(provider).typedCall`,
// the same `typedCall` the per-coin `api/*.ts` modules consume — so if a future change breaks the
// `TypedCallProvider` -> bound `typedCall` resolution, the `@ts-expect-error` directives below
// become unused and type-check fails (TS2578).

import type { MessagesSchema as Messages } from '@trezor/protobuf';

import { DeviceCommands } from '../src/device/DeviceCommands';
import type { TypedCallProvider } from '../src/types/typed-call-provider';

declare const provider: TypedCallProvider;
declare const wireOut: Messages.WireOutMessage;

const { typedCall } = DeviceCommands(provider);

// Valid: GetFeatures (wire_in) request -> Features (wire_out) response.
const valid = typedCall('GetFeatures', 'Features');

// Valid: the Monero stateful signing requests are sent host -> device and are tagged wire_in.
const validMoneroRequest = typedCall('MoneroTransactionInitRequest', 'MoneroTransactionInitAck');

// @ts-expect-error request must be a host -> device message; 'PublicKey' is wire_out.
const badRequestDirection = typedCall('PublicKey', wireOut);

// @ts-expect-error expected response must be a device -> host message; 'GetPublicKey' is wire_in.
const badResponseDirection = typedCall('GetPublicKey', 'GetPublicKey');

// Valid: the array-response overload (R extends WireOutMessage[]) accepts a list of wire_out messages.
const validArrayResponse = typedCall('SignTx', ['TxRequest', 'ButtonRequest']);

// @ts-expect-error every array response must be a device -> host message; 'GetPublicKey' is wire_in.
const badArrayResponseDirection = typedCall('SignTx', ['TxRequest', 'GetPublicKey']);

// @ts-expect-error 'NotAMessage' is not a known protobuf message.
const badMessageName = typedCall('NotAMessage', wireOut);

void valid;
void validMoneroRequest;
void badRequestDirection;
void badResponseDirection;
void validArrayResponse;
void badArrayResponseDirection;
void badMessageName;
