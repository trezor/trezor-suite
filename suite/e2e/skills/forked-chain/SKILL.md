---
name: forked-chain
description: Running Suite E2E tests against a local Anvil fork of an EVM network (the `anvil` fixture), funding accounts, controlling mining and time, and driving a fork by hand. Use when a test needs real contract execution or when exploring or debugging EVM flows against a fork.
---

# Forked Chain (Anvil) in Suite E2E Tests

> **When to use**: A test whose correctness depends on transactions really executing on an EVM chain (sends that must land, approvals, deposits, staking, protocol state), or when exploring or debugging such a flow by hand.
> **Prerequisites**: [fixtures](../fixtures/SKILL.md), [retries](../retries/SKILL.md), [tagging](../tagging/SKILL.md).

The `anvil` fixture (`support/anvil.ts`) starts a fresh Anvil fork for each test, and Suite connects to it as a custom `evm-rpc` backend. Signed transactions execute against real mainnet contracts and state, so the test can assert on chain as well as in the UI. Fork URLs and chain ids per network live in `support/anvilNetworks.ts`.

## Choosing a backend

```
Does the flow need real contract execution or real chain state?
├── YES → anvil fixture (this skill)
└── NO  → Do you need an exact, hand-crafted backend state (edge cases, error states, pagination)?
    ├── YES → blockbookMock (support/mocks/blockBookMock.ts)
    └── BTC-like → regtest through trezorUserEnv
```

## Setup

```typescript
import { asNetworkSymbol } from '@suite-common/wallet-config';

test.use({
    deviceSetup: { mnemonic: FRESH_MNEMONIC },
    // Optional. Defaults to { symbol: eth }. Any network with an evm-rpc backend and a fork URL.
    anvilFork: { symbol: asNetworkSymbol('base') },
});

test.beforeEach(async ({ anvil, onboardingPage, settingsPage, walletPage }) => {
    // Native balance before discovery, so Suite finds the account.
    await anvil.setBalance(OWNER_ADDRESS, parseEther('1'));
    await onboardingPage.completeOnboarding();
    await settingsPage.changeNetworks({ enableNetworks: [anvil.networkToEnable] });
    await walletPage.openAccount({ symbol: asNetworkSymbol('base') });
    // Tokens once Suite watches the account, so its live watcher reports the Transfer.
    await anvil.fundErc20(USDC_CONTRACT, OWNER_ADDRESS, parseUnits('1000', 6));
});
```

`anvilFork` options: `symbol`, `forkUrl`, `blockNumber`, `automine` (default `true`) and `baseFeePerGas`.

Suite offers the `evm-rpc` backend type only in debug mode (unless it is the network's default), so `changeNetworks` turns debug mode on whenever it is given an `evm-rpc` backend.

How Suite's `evm-rpc` worker sees the fork decides the order of setup:

- Discovery loads only an account's balance and nonce, so the native balance must be there first.
- Tokens are known only from `Transfer` logs. A live watcher polls every 10 s, in real time, for logs in blocks mined since the account was subscribed, and reports them to Suite. Its scan of older blocks goes through the fork's upstream RPC, which is slow and rate-limited, so do not rely on it. Fund tokens after `changeNetworks` and `openAccount`, then wait for Suite with an explicit timeout (e.g. `toBeVisible({ timeout: 30_000 })`); `page.clock` does not speed the worker up.
- The worker reads logs 2 blocks behind the tip, and an automining fork mines no block until the next transaction. With automine on, `AnvilFork` therefore mines 2 extra blocks after each transaction it sends itself. Until those blocks exist, Suite shows no tokens: the Earn dashboard offers "Buy" instead of "Deposit now", for example.

## Core Rules

MUST: Request `anvil` as a fixture and configure it with `test.use({ anvilFork })`. Never construct `AnvilFork` in a test.
MUST: Connect Suite with `anvil.networkToEnable`. Do not build the backend object by hand.
MUST: Start from a clean address: a mnemonic generated for the test (comment why, as in `tests/yield/deposit-anvil.test.ts`). Shared seeds carry real mainnet balances, tokens and allowances into the fork. When a shared seed is unavoidable, assert deltas, not absolute values.
MUST: Fund native balance before `changeNetworks`, and ERC-20 tokens after `changeNetworks` and `walletPage.openAccount`, then wait for Suite to show them.
MUST: Fund ERC-20 tokens with `fundErc20`. It sends a real `transfer`, and the evm-rpc backend discovers an account's tokens only from `Transfer` logs.
MUST: Assert outcomes on chain (`expect.poll(() => anvil.readErc20Balance(...))`) **and** in Suite.
MUST: Read chain-dependent values (fees, share amounts, symbols) from Suite or from the fork at runtime (e.g. `devicePrompt.cryptoAmountWithSymbolOf('fee').innerText()`, `anvil.readErc20Metadata`).
MUST: Keep third-party HTTP APIs mocked with `page.route` where the flow needs them (yield metadata, Blockaid simulation). That makes the test `@webOnly`. Contracts are never mocked.
MUST: Assert values Suite derives from mocked API data against the mock, not the chain, and check the chain separately. E.g. the yield "Received" amount is Suite's estimate from the mocked vault `pricePerShare`, while the vault mints shares at its real on-chain price.
MUST_NOT: Write balances straight into storage for an account Suite has to discover.
MUST_NOT: Hardcode block numbers, timestamps, fees or nonces that the latest block decides.
MUST_NOT: Use `waitForTimeout` to wait for a confirmation.

## Confirmations

With automine on, every transaction is mined the moment it is sent. Suite only notices by polling, so fast-forward the page clock until the UI catches up:

```typescript
await page.clock.install(); // before the action whose confirmation you wait for

await expect(async () => {
    await page.clock.fastForward('00:30');
    await expect(yieldFlowSection.approvedAmount).toHaveText('10 USDC');
}, 'Suite should pick up the confirmed approval').toPass({ timeout: 60_000 });
```

`toastSection.openTxSentDetailsAndWaitForConfirmation()` wraps the same pattern for the sent-transaction detail.

## Pending transactions, replacement and time-locked flows

```typescript
await anvil.setAutomine(false); // or anvilFork: { automine: false }
// ...user signs and broadcasts in Suite...
await expect.poll(() => anvil.getPendingTransactionHashes()).toHaveLength(1);
// assert the pending state in Suite, bump the fee / cancel, then:
await anvil.mine();

await anvil.dropTransaction(hash); // the network "forgets" a broadcast transaction
await anvil.increaseTime(7 * 24 * 3600); // withdrawal periods, reward accrual; mines a block
await anvil.setNextBlockBaseFee(parseGwei('50')); // fee spikes, deterministic fee screens
```

## Acting as other accounts

Any address can send without its key. An account that cannot cover value plus gas is topped up first; mainnet addresses often hold dust, so this is not limited to empty ones:

```typescript
await anvil.sendNativeAs(SENDER, OWNER_ADDRESS, parseEther('0.1')); // incoming transfer
await anvil.writeContractAs(PROTOCOL_ADMIN, { address, abi, functionName, args }); // protocol action
const value = await anvil.readContract({ address, abi, functionName, args });

const id = await anvil.snapshot();
// ...change state...
await anvil.revert(id);
```

With automine on, these calls resolve once the transaction is mined and 2 more blocks follow it (for the worker's log lag), and throw if it reverted. With automine off they resolve with the hash as soon as it is in the mempool; `mine()` is then up to the test.

## Determinism and limits

- The fork follows the latest block. Pin one with `anvilFork: { blockNumber }` or `ANVIL_FORK_BLOCK_NUMBER_<SYMBOL>` only when the test depends on state at that block. Pinning needs an archive-capable fork URL.
- Default fork URLs are public endpoints with rate limits. `ANVIL_FORK_URL_<SYMBOL>` overrides one, e.g. `ANVIL_FORK_URL_BASE`.
- Public L2 nodes keep only a few minutes of recent state. A long test that reads untouched contracts late may fail with "missing trie node". Use an archive URL for it.
- Adding a network takes one line in `ANVIL_FORK_URLS` (`support/anvilNetworks.ts`). The chain id comes from Suite's network config, and only networks with an `evm-rpc` backend can be forked.
- CI installs Foundry in `.github/workflows/template-suite-run-e2e.yml`. Locally, install it with `foundryup` or point `ANVIL_BIN` at the binary.

## Driving a fork by hand

Use this to explore a flow before writing the test, or to inspect state when a test fails:

```bash
anvil --fork-url https://eth-mainnet.g.alchemy.com/public --chain-id 1 --port 8545
cast rpc anvil_setBalance 0xOwner 0xDE0B6B3A7640000 --rpc-url http://127.0.0.1:8545  # 1 ETH
cast balance 0xOwner --rpc-url http://127.0.0.1:8545
cast call 0xToken "balanceOf(address)(uint256)" 0xOwner --rpc-url http://127.0.0.1:8545
cast rpc anvil_impersonateAccount 0xWhale --rpc-url http://127.0.0.1:8545
cast send 0xToken "transfer(address,uint256)" 0xOwner 1000000 --from 0xWhale --unlocked --rpc-url http://127.0.0.1:8545
cast rpc evm_increaseTime 3600 --rpc-url http://127.0.0.1:8545 && cast rpc evm_mine --rpc-url http://127.0.0.1:8545
```

To point a running Suite (`yarn suite:dev`) at the fork, open Settings → Coins, open the network's advanced settings, choose the `evm-rpc` backend and enter `http://127.0.0.1:8545`.

## Anti-Patterns

❌ Funding a token by writing its balance slot (`anvil_setStorageAt`). The evm-rpc backend sees no `Transfer` log, so Suite never lists the token. Use `fundErc20`.

❌ Asserting the absolute balance of a shared test seed. Mainnet state leaks in:

```typescript
await expect(anvil.getBalance(MNEMONIC_ALL_ADDRESS)).resolves.toBe(parseEther('0.9'));
```

❌ Hardcoding a fee that the fork's base fee decides:

```typescript
await expect(devicePrompt.cryptoAmountWithSymbolOf('fee')).toHaveText('0.000031 ETH');
```
