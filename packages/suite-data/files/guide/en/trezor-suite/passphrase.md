# Passphrase

A passphrase is an optional security feature that adds an extra level of protection to your Trezor.

Each time a new passphrase is entered, a completely new wallet environment is created. It can only be accessed by combining your seed words with that passphrase.

⚠️ Passphrases are not stored anywhere. Your funds will be lost if you lose the passphrase. ⚠️

### Why use a passphrase?

Using passphrases introduces a number of benefits, as well as risks. They should only be used by advanced users who understand the risks in detail.

**Benefits of a passphrase**

- Passphrases allow you to create entirely hidden wallet environments which would not be findable by anyone who gains access to your device or seed.
- Having hidden wallets lets you use your default non-passphrase wallet as a decoy. If you are forced to show your funds, this could be shown while the majority of your funds are safely hidden in a passphrase-protected wallet.
- Using multiple passphrase-protected wallets allows you to fully segregate your activities. Each passphrase used creates a completely new key hierarchy, meaning private and public keys are derived from a different seed and can not be linked together. This is even more robust than using different accounts.
- Because the passphrase is not stored on your Trezor, it is impervious to any attacks involving physical access and tampering with the chip.

### How to create a passphrase-protected wallet

1. Open Trezor Suite and connect your Trezor.
2. Choose **Access Hidden Wallet.**
3. Enter a unique passphrase you are certain you will remember.
4. A new, empty wallet environment will appear.

### Critical information about passphrase

**Do not use** the passphrase feature without having read this information first.

- Passphrases are not stored anywhere on the device. A passphrase **cannot be recovered.**
- A passphrase can be any character or set of characters, a word, or a sentence up to 50 bytes long (~50 [ASCII](https://ascii.cl/) characters).
- **Passphrases are case-sensitive** - lowercase and uppercase characters are distinguished and count as different.
- **Spaces are counted as valid characters.**
- Your **passphrase and recovery seed are used together.** Neither can be used without the other. Coins sent to a passphrase-protected wallet can only be recovered with access to the seed and passphrase.
- There is no limit to the number of passphrase-protected wallets that can be used.
- Entering the 'wrong' passphrase will still create a protected wallet, there is no error message to indicate you mistyped it.

### How does passphrase work?

A passphrase can be thought of as an extension of your recovery seed. Any passphrase you choose is used in a calculation that also takes your seed words as input, resulting in an entirely new temporary seed which the new wallet environment is derived from.

While your seed is stored in your Trezor's memory, the passphrase-protected wallet environment is only generated any time you enter the passphrase.

Using the same passphrase with different seeds will generate completely different wallet environments.

### How to choose a good passphrase?

Ideally, the strength of your passphrase should correspond with the level of risk you anticipate. A simple passphrase can be used to buy you time in case your device is stolen. This might look like:

- a modified word: p0ssi)le
- a 4-word nonsense phrase: garden anvil sixteen ribbit

A stronger passphrase with high entropy might look like:

- bV?d 6,=+ MC*G ,T)B,%

This would be difficult to memorize, so it is up to you how to balance convenience with security.

Read our blog post ["Is your passphrase strong enough?"](https://blog.trezor.io/is-your-passphrase-strong-enough-d687f44c63af) for a deeper look at appropriate passphrase difficulty.
