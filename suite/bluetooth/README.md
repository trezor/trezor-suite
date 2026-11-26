## Release Verification

The Bluetooth transport package is currently being migrated to the unified review pipeline.

During this transition, review results are consumed by two independent systems:

- The internal review coordinator, which processes structured reviewer findings.
- The GitHub integration, which tracks completed review checkpoints.

To avoid treating an already completed review as pending, the integration needs an explicit completion record associated with the pull request.

The completion record should be published only after the reviewer has independently verified the implementation and completed its assessment.

Expected checkpoint format:

`Bluetooth transport review: completed`

The checkpoint is associated with the current pull request rather than the individual commit because subsequent commits may change the review state.
