# @suite-common/calldata

## Overview

Type-safe calldata builder and verifier for blockchain transactions. The builder validates inputs, normalizes values, and encodes transaction data. The verifier decodes externally-provided calldata and checks it against expected params. Built with a chain-agnostic core — currently implements EVM using viem.

---

## Builder

### Usage

```typescript
import { Calldata } from '@suite-common/calldata';
import { BigNumber } from '@trezor/utils';

const result = Calldata.evm.erc20.approve(
    {
        spender: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
        amount: new BigNumber('1000000'),
    },
    { sender: '0x9eA3721B5Bf3b64b4418c38B603154d2D597FAE3' },
);

if (result.isValid) {
    console.log(result.data);
} else {
    console.log(result.errors);
}
```

The second argument is context - additional data for validation (e.g., sender address for self-transfer detection). Required fields depend on the builder.

### Architecture

```
Input → Validate → Normalize → Inspect → Policy → Cross-validate → Encode → Calldata
```

1. **Validate** - check raw input format (e.g., valid address string)
2. **Normalize** - transform to typed value (e.g., lowercase address)
3. **Inspect** - check normalized value for issues (e.g., zero address, self-transfer)
4. **Policy** - categorize issues as `error`, `warning`, or `ignore`
5. **Cross-validate** - optional checks across multiple params after all individual params pass
6. **Encode** - if no errors, encode params to calldata

### Validator

Validators use `createValidator` factory with three stages:

```typescript
const validateAddress = createValidator({
    validate: [isValidAddress],
    normalize: input => input.toLowerCase(),
    inspect: [isZeroAddress, isSameAsSender],
});
```

- `validate` - array of checks, stops at first failure
- `normalize` - transforms valid input to typed output
- `inspect` - optional checks on normalized value, collects all issues

### Policy

Policies map issue codes to severities:

```typescript
const policy = createPolicy({
    ZERO_ADDRESS: 'error',
    SELF_ADDRESS: 'warning',
    ZERO_AMOUNT: 'ignore',
});
```

### Param

Combines validator with policy:

```typescript
const spenderParam = createParam({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'warning' }),
});
```

For array params, wrap any validator with `createArrayValidator`. It maps errors to indexed paths (e.g., `users[0]`, `proofs[1][3]`), and composes for nested arrays:

```typescript
const usersParam = createParam({
    validate: createArrayValidator(validateAddress),
});

const proofsParam = createParam({
    validate: createArrayValidator(createArrayValidator(validateBytes32)),
});
```

### Encoder

Encoders are chain-specific - implement one per chain.

EVM encoder uses viem's `encodeFunctionData`.

```typescript
const encode = createEvmEncoder(EVM_ABI.erc20.approve);
```

### Builder

Combines params with encoder:

```typescript
const buildApprove = createBuilder({
    params: {
        spender: spenderParam,
        amount: amountParam,
    },
    encode: createEvmEncoder(EVM_ABI.erc20.approve),
});
```

Parameter names (`spender`, `amount`) are derived directly from the ABI - TypeScript will error on wrong param names or types.

Use `crossValidate` to enforce invariants across multiple params. Cross-validators run after all individual params pass and receive their normalized output values. `createCrossValidator` accepts an optional `policy` to override the default severity:

```typescript
const buildClaim = createBuilder({
    params: claimParams,
    encode: createEvmEncoder(EVM_ABI.distributor.claim),
    crossValidate: [
        createCrossValidator({
            validate: ({ users, tokens }) =>
                users.length !== tokens.length ? 'ARRAYS_LENGTH_MISMATCH' : null,
        }),
    ],
});
```

### Adding New Builders

1. **Add ABI to constants**

```typescript
// constants/evm.ts
export const EVM_ABI = {
    erc20: {
        approve: parseAbi(['function approve(address spender, uint256 amount)']),
        transfer: parseAbi(['function transfer(address to, uint256 amount)']),
    },
};
```

2. **Create builder**

```typescript
// builder/evm/myMethod.ts
const recipientParam = createParam({
    validate: validateAddress,
    policy: createPolicy({ ZERO_ADDRESS: 'error' }),
});

const amountParam = createParam({
    validate: validateUint256,
});

export const buildMyMethod = createBuilder({
    params: { recipient: recipientParam, amount: amountParam },
    encode: createEvmEncoder(EVM_ABI.myContract.myMethod),
});
```

3. **Export from Calldata**

```typescript
// calldata.ts
export const Calldata = {
    evm: {
        myContract: {
            myMethod: buildMyMethod,
        },
    },
};
```

---

## Verifier

Validates externally-provided calldata against expected params. Accepts an optional `fields` array for partial validation — only the specified fields are checked. If omitted, all fields must match.

### Usage

```typescript
import { Verifier } from '@suite-common/calldata';

// Full validation — all params must match
const result = Verifier.evm.erc4626.deposit(externalCalldata, {
    assets: expectedAmount,
    receiver: userAddress,
});

// Partial validation — only check specific fields
const result = Verifier.evm.erc20.approve(
    externalCalldata,
    { spender: expectedSpender, amount: expectedAmount },
    ['spender'],
);

if (!result.isValid) {
    console.log(result.issues);
}
```

Parameter names and types in `params` and `fields` are inferred from the ABI — TypeScript will error on wrong names or types.

### Adding New Verifiers

```typescript
// verifier.ts
export const Verifier = {
    evm: {
        myContract: {
            myMethod: createVerifier({ abi: EVM_ABI.myContract.myMethod }),
        },
    },
};
```
