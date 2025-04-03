import styled from 'styled-components';

import { useSelector } from 'src/hooks/suite';
import { selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';

const TRUNCATION_PLACEHOLDER = ' ... ';

const AddressWrapper = styled.p`
    text-wrap: balance;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0;
    word-break: break-all;
`;

const addSpacing = (value: string) => value.match(/.{1,4}/g)?.join(' ') || value;

export type AddressProps = {
    value: string;
    isTruncated?: boolean;
    isChunked?: boolean;
    'data-testid'?: string;
};

export const Address = ({
    value,
    isTruncated,
    isChunked,
    'data-testid': dataTestId,
}: AddressProps) => {
    const isChunkedSettings = useSelector(selectAddressDisplayType);
    const isAddressChunked = isChunked ?? isChunkedSettings === 'chunked';
    const placeholder = isAddressChunked ? TRUNCATION_PLACEHOLDER : TRUNCATION_PLACEHOLDER.trim();

    const [full, beginning, middle, end] = (value.match(/^(.{8})(.*)(.{8})$/) || []).map(part =>
        isAddressChunked ? addSpacing(part) : part,
    );

    const formattedValue = isTruncated ? beginning + placeholder + end : full;

    const handleCopy = (e: React.ClipboardEvent) => {
        const selection = window.getSelection()?.toString();

        e.preventDefault();
        e.clipboardData?.setData(
            'text/plain',
            selection?.replace(placeholder, middle).replace(/\s/g, '') ?? value,
        );
    };

    return (
        <AddressWrapper onCopy={handleCopy} data-testid={dataTestId}>
            {formattedValue ?? value}
        </AddressWrapper>
    );
};
