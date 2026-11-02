# Architecture decision records

An Architecture Decision Record, or ADR, is a short document that explains one architecturally
significant decision, its context, the alternatives considered, and its consequences. Keep each ADR
to a couple of pages at most and link to supporting issues, documents, and measurements.

## Why we use ADRs

ADRs preserve the reasoning, constraints, and trade-offs behind Suite's architecture for future
contributors. Writing proposals helps reviewers uncover and discuss different assumptions.

## When to write an ADR

Use an ADR for a decision that affects multiple teams and is costly to reverse.

Handle isolated team issues, code style preferences with little impact, and rules that are cheap to
change in the relevant issue or PR.

## Write a proposal

1. Copy [TEMPLATE.md](./TEMPLATE.md) into this directory. Name the file `<number>-<short-title>.md`,
   for example `042-native-instead-of-react-native.md`. Use the next unused number and check open
   ADR pull requests for collisions.
1. State the decision as a sentence in the title. Explain its context, rationale, rejected
   alternatives, consequences, and when we should revisit it.
1. Open a pull request with the `ADR:` title prefix and the `ADR` label. Set a feedback deadline in
   its description, five working days after marking it ready for review. The author or any Team Lead
   may extend the deadline.
1. Announce the PR in the #wg_suite-architecture Slack channel and mention @channel. Every Suite
   developer should read it. Anyone may contribute to the discussion in the PR. Revise the proposal
   as needed before acceptance.

## Review and acceptance

Use these reviews and reactions on the PR:

| Review or reaction  | Meaning                                                          |
| ------------------- | ---------------------------------------------------------------- |
| **Approve**         | I actively support the proposal.                                 |
| **Request changes** | I actively oppose the proposal.                                  |
| 👍                  | I like it.                                                       |
| 👀                  | I've read it. I have no strong opinion, or it doesn't affect me. |
| 👎                  | I dislike it but have no strong opinion.                         |

A **Request changes** review requires a comment explaining your objection.

If you are concerned about long-term negative consequences, submit a **Request changes** review and
be prepared to discuss them with the author. The author has put effort into a proposal they care
about, so opposing it also requires effort to explain your reasoning and discuss solutions.

Each Team Lead or their delegate should vote. At the deadline, a proposal can be accepted with at
least one Approve review and no outstanding Request changes reviews. Team Leads are responsible for
accepted ADRs and resolve disagreements through the Architecture Council.

### Architecture Forum

Anyone may attend an Architecture Forum. The author or any Team Lead may convene one before the
decision deadline.

An unresolved Request changes review requires a Forum. The author and all reviewers with outstanding
change requests must attend to discuss objections and solutions. The author summarizes the outcome
in the PR.

### Architecture Council

If disagreement remains unresolved at the deadline, Team Leads must promptly convene an Architecture
Council. Team Leads or their delegates make the decision.

## Keep the decision history

Keep accepted ADRs in `docs/adr`. Leave the decision unchanged after acceptance. To change it,
propose a superseding ADR and link the two records in both directions.

Archive rejected proposals in `docs/adr/rejected` under their original numbers and filenames.
Exclude proposals that do not qualify as ADRs.
