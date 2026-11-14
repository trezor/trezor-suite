# 🗣️ ADR-002: Ubiquitous Language

Status: 📝 Proposed

## 🧭 Context

In philosophy, **ontology** asks what kinds of things exist and how they relate. Applied to Suite,
it asks three questions about our domain:

- **What makes a concept a thing of its own?** It has an identity that tells its instances apart
  and rules that govern its behavior. (For example: a token is identified by its network and
  contract address, not by its ticker, and is transferred differently from a native token.)
- **Which concepts are distinct?** Concepts with different identities or rules stay separate, even
  when everyday speech uses one word for them. (For example: Ethereum the network and ETH its
  native token are often both called Ethereum.)
- **How do they relate?** Relations determine how identifiers are composed and which operations
  apply to which concept. (For example: a network belongs to a network family and has one native
  token; a token is issued on a network, so its identifier combines the network and its address.)

> [!IMPORTANT]
> Ethereum the network, ETH its native token, and USDC issued on it are different things with
> different identifiers and rules, yet everyday speech calls them all a coin. Giving each concept
> exactly one name, and each name exactly one concept, lets a word mean the same thing in a
> conversation, an issue, and the code, so what we say maps directly to the types we write, and back.

Suite has no agreed definitions of its core domain concepts, so each team names and models them
according to its own understanding:

- **One concept, many names.** About 600 typed fields name a network identifier `symbol`, 250 name
  it `networkSymbol`, and others `coin` or `coinSymbol`. A token's contract address is `contract`,
  `contractAddress`, `tokenContract`, or `tokenAddress`, each used hundreds of times.
- **One name, many concepts.** `symbol` is a `NetworkSymbol` in some code and a token ticker in
  other code; `coin` can mean a network, its native token, or any token.

### 💥 Practical impact

- 💬 **Conversations.** Discussions stall on defining terms: participants spend minutes agreeing
  what a coin or a token is before they can discuss the actual problem.
- 🔍 **Search and review.** Searching by one name misses code using another; reviewers must work out
  which meaning `symbol` or `coin` has in each file.
- 🐛 **Correctness.** Without a shared definition, teams model the same concept differently. (For
  example: code that matched tokens by ticker instead of by network and contract would break when
  two tokens share a ticker, which anyone can cause by issuing a token named USDC.)
- 🧩 **Integration.** Features spanning several teams, such as trading, earn, and portfolio, map
  between each team's names, adding conversion code and room for bugs.
- 📈 **Growth.** Newcomers and coding agents learn the vocabulary from existing code and copy
  whichever name they see first, so every new feature adds to the inconsistency.

The cost is uneven and easy to miss. Within one team or code area the vocabulary is consistent, so
its members may rarely notice it. The cost falls at the boundaries: on people who work across teams
and packages, review code, or are new, and on product and QA translating between the UI, issues,
and code. It recurs each time work crosses such a boundary.

> [!TIP]
> Network and Token are core concepts that most Suite features handle. Define them regardless of
> how often the ambiguity hurts today: an undefined core concept is a latent source of defects, and
> unifying gets more expensive with every feature built on divergent names.

### 🎯 Scope

- A glossary does not remove the need to clarify terms in conversation. It gives one reference that
  settles the question, so the clarification is needed less often.
- A technical identifier may differ from its user-facing name when the glossary defines both and
  their relation. For example, the device model `T3B1` is sold as Trezor Safe 3; internal
  identifiers also stay stable for unreleased products whose names change before release.
- The table starts with the concepts causing confusion today: Network, NetworkFamily,
  NativeToken, and Token. Add further terms when their ambiguity causes problems.

## ✅ Decision

- Maintain a shared [Ubiquitous Language table](../ubiquitous-language.md) with each domain concept's
  name, branded identifier type and example, explanation, and old aliases to replace.
- Use the agreed terms in code and documentation. **This is mandatory:** rename and refactor existing
  code to unify its language, as well as using the terms in new code.
- Use the same terms in communication across the company wherever possible, and stop using the
  old aliases for those concepts.
- Document the corresponding TypeScript types, including branded identifier types, with JSDoc
  explaining the concept consistently with the table and linking to [the glossary](../ubiquitous-language.md).
  Update the JSDoc and glossary together in the same pull request when a definition changes, so
  explanations in code and documentation stay in sync.

## 🚫 Rejected alternatives

- Keeping the status quo: leaves conflicting names in place and requires everyone to keep
  translating between teams, documentation, and code.

## 🔮 Consequences

Changes to the table are both documentation updates and domain decisions. Agree on additions and
changes through pull requests, seeking broad consensus among affected teams before adopting them.
Prefer established industry terminology, guided by domain experts and product people. Developers
contribute implementation knowledge, but naming must reflect the domain rather than developer
preferences alone.

## 📚 Sources

Eric Evans's _Domain-Driven Design: Tackling Complexity in the Heart of Software_, chapter 2,
introduces **Ubiquitous Language**: developers and domain experts use and refine a shared language
based on their domain model.
