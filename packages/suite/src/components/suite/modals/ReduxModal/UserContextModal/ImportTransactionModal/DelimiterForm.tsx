import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Switch, Input, variables } from '@trezor/components';
import { Translation } from 'src/components/suite';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    min-height: 36px; /* Input height */
    margin-top: 16px;
`;

const Label = styled.span`
    padding: 0 14px;
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    white-space: nowrap;
`;

const StyledInput = styled(Input)`
    width: 120px;
`;

interface DelimiterFormProps {
    value?: string;
    onChange: (value?: string) => void;
}

export const DelimiterForm = ({ value, onChange }: DelimiterFormProps) => {
    const [custom, setCustom] = useState(false);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // handle `custom` change and focus the input
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [custom]);

    return (
        <Wrapper>
            <Switch
                onChange={() => {
                    if (custom) {
                        // reset delimiter value in parent component
                        onChange(undefined);
                    }
                    setCustom(!custom);
                }}
                isChecked={!custom}
            />
            <Label>
                <Translation
                    id={
                        custom
                            ? 'TR_IMPORT_CSV_MODAL_DELIMITER_CUSTOM'
                            : 'TR_IMPORT_CSV_MODAL_DELIMITER_DEFAULT'
                    }
                />
            </Label>
            {custom && (
                <StyledInput
                    size="small"
                    onChange={({ target }) => onChange(target.value)}
                    defaultValue={value}
                    innerRef={inputRef}
                />
            )}
        </Wrapper>
    );
};
