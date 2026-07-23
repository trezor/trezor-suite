import { useEffect, useRef, useState } from 'react';

import { Translation } from '@suite/intl';
import { Input, Row, SelectBar } from '@trezor/components';
type DelimiterFormProps = {
    value?: string;
    onChange: (value?: string) => void;
};

export const DelimiterForm = ({ value, onChange }: DelimiterFormProps) => {
    const [mode, setMode] = useState<'default' | 'custom'>('default');
    const inputRef = useRef<HTMLInputElement | null>(null);

    // handle `custom` change and focus the input
    useEffect(() => {
        onChange(undefined);

        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [mode, onChange]);

    return (
        <Row gap={16} justifyContent="space-between">
            <SelectBar
                label={<Translation id="TR_IMPORT_CSV_MODAL_DELIMITER" />}
                options={[
                    {
                        label: <Translation id="TR_IMPORT_CSV_MODAL_DELIMITER_DEFAULT" />,
                        value: 'default',
                    },
                    {
                        label: <Translation id="TR_IMPORT_CSV_MODAL_DELIMITER_CUSTOM" />,
                        value: 'custom',
                    },
                ]}
                selectedOption={mode}
                onChange={setMode}
                size="small"
            />
            {mode === 'custom' && (
                <Input
                    maxWidth={120}
                    onChange={({ target }) => onChange(target.value)}
                    defaultValue={value}
                    innerRef={inputRef}
                    size="small"
                />
            )}
        </Row>
    );
};
