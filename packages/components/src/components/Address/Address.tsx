import styled from 'styled-components';

const TRUNCATION_THRESHOLD = 8;
const TRUNCATION_PLACEHOLDER = ' ... ';

const AddressWrapper = styled.p`
    text-wrap: balance;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0;
`;

const addSpacing = (value: string) => value.match(/.{1,4}/g)?.join(' ') || value;

export type AddressProps = {
    value: string;
    isTruncated?: boolean;
};

export const Address = ({ value, isTruncated }: AddressProps) => {
    const formattedValue = isTruncated
        ? addSpacing(value.slice(0, TRUNCATION_THRESHOLD)) +
          TRUNCATION_PLACEHOLDER +
          addSpacing(value.slice(-TRUNCATION_THRESHOLD))
        : addSpacing(value);

    const handleCopy = (e: React.ClipboardEvent) => {
        const selection = window.getSelection()?.toString();

        e.preventDefault();
        e.clipboardData?.setData(
            'text/plain',
            selection
                ?.replace(
                    TRUNCATION_PLACEHOLDER,
                    value.slice(TRUNCATION_THRESHOLD, -TRUNCATION_THRESHOLD),
                )
                .replace(/\s/g, '') ?? value,
        );
    };

    return <AddressWrapper onCopy={handleCopy}>{formattedValue}</AddressWrapper>;
};
