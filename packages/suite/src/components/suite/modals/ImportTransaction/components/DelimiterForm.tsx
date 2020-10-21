import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Switch, Input, P } from '@trezor/components';
import { Translation } from '@suite-components';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    min-height: 32px; /* Input height */
    margin-top: 16px;
`;

const Label = styled(P)`
    padding: 0px 8px;
`;

interface Props {
    value?: string;
    onChange: (value?: string) => void;
}

export const DelimiterForm = ({ value, onChange }: Props) => {
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
                checked={!custom}
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
                <Input
                    noTopLabel
                    noError
                    variant="small"
                    monospace
                    width={120}
                    wrapperProps={{ width: 120 }}
                    onChange={({ target }) => onChange(target.value)}
                    defaultValue={value}
                    innerRef={inputRef}
                />
            )}
        </Wrapper>
    );
};
