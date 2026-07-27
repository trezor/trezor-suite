import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import type { ProtoWithDerivationPath } from '../../types/params';
import { fixPath } from '../pathUtils';

declare const inputWithDerivationPath: ProtoWithDerivationPath<PROTO.TxInputType>;
declare const outputWithDerivationPath: ProtoWithDerivationPath<PROTO.TxOutputType>;

const normalizedInput: PROTO.TxInputType = fixPath(inputWithDerivationPath);
const normalizedOutput: PROTO.TxOutputType = fixPath(outputWithDerivationPath);

// @ts-expect-error A normalized input must not be typed as a transaction output.
const normalizedInputAsOutput: PROTO.TxOutputType = fixPath(inputWithDerivationPath);

// @ts-expect-error A normalized output must not be typed as a transaction input.
const normalizedOutputAsInput: PROTO.TxInputType = fixPath(outputWithDerivationPath);

void normalizedInput;
void normalizedOutput;
void normalizedInputAsOutput;
void normalizedOutputAsInput;
