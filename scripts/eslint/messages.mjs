export const lintMessageTypes = Object.freeze({
    LINT: 'lint',
    LINT_SUCCESS: 'lint-success',
    LINT_ERROR: 'lint-error',
});

export const lintMessage = (workspace, eslintArgs) =>
    Object.freeze({
        type: lintMessageTypes.LINT,
        eslintArgs,
        workspace,
    });

export const lintSuccessMessage = () =>
    Object.freeze({
        type: lintMessageTypes.LINT_SUCCESS,
    });

export const lintErrorMessage = error =>
    Object.freeze({
        type: lintMessageTypes.LINT_ERROR,
        error,
    });
