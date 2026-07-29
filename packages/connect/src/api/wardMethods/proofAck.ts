import type { MessagesSchema as Messages } from '@trezor/protobuf';
import type { ProofPackage } from '@trezor/ward';

/**
 * Map a normalized app-layer ProofPackage onto the wire WARDProofAck the device
 * pulls on demand (WARDProofRequest): membership → value/counter, non-membership →
 * witness_*. Shared by the pull-model write (wardUpdate) and label display
 * (wardDisplayAddress).
 */
export const toProofAck = (pkg: ProofPackage): Messages.WARDProofAck =>
    pkg.kind === 'membership'
        ? { value: pkg.valueHex, proof: pkg.proof, counter: pkg.counter }
        : {
              proof: pkg.proof,
              ...(pkg.witnessAddressHex !== undefined && {
                  witness_address: pkg.witnessAddressHex,
                  witness_value: pkg.witnessValueHex!,
                  witness_counter: pkg.witnessCounter!,
              }),
          };
