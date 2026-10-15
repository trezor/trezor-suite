# @trezor/calldata

Shared calldata contracts, builders, validators, and policies.

Ethereum and Tron implementations live in their network common packages. Their existing APIs
are preserved: Ethereum keeps `evm.erc20`, `evm.erc4626`, `evm.distributor`, `evm.everstake`,
`evm.ens`, and `evm.weth`, with a separate `Verifier`; Tron keeps `tron.trc20`.

Suite obtains the selected implementation through the injected `networks.getCalldata(symbol)`
service. Helpers receive that implementation explicitly. `getEvmCalldata` and `getTronCalldata`
narrow the supported network API without choosing a protocol or changing calldata behavior.

```typescript
import { type Calldata, getEvmCalldata } from '@trezor/calldata';
import { type BigNumber } from '@trezor/utils';

export const buildApproval = (
    calldata: Calldata | undefined,
    params: { spender: string; amount: BigNumber },
) => getEvmCalldata(calldata).evm.erc20.approve.encode(params);
```

The implementation owns its ABIs, address types, and encoding and verification logic.
The shared building pipeline remains:

```text
Validate → Normalize → Inspect → Apply policy → Cross-validate → Encode
```
