export const normalizeLabel = (label: string | null) =>
    // No-label is represented as NULL. In current logic we do not allow for "" labels as
    // we want to always display something (default placeholder)
    label === null || label.trim() === '' ? null : label;
