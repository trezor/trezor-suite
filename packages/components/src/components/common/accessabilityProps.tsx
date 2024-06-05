export type AccessabilityProps = {
    tabIndex?: number;
};

export const withAccessabilityProps = ({ tabIndex }: AccessabilityProps) => {
    return { tabIndex };
};
