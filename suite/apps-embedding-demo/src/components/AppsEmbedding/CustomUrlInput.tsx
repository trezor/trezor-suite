import { useState } from 'react';

import { Button, Input, Row } from '@trezor/components';

const hasUrlScheme = (value: string) => /^[a-z][a-z0-9+.-]*:/i.test(value);

type CustomUrlInputProps = {
    onSubmit: (url: string) => void;
};

export const CustomUrlInput = ({ onSubmit }: CustomUrlInputProps) => {
    const [value, setValue] = useState('');

    const handleSubmit = () => {
        const trimmedValue = value.trim();
        onSubmit(hasUrlScheme(trimmedValue) ? trimmedValue : `https://${trimmedValue}`);
    };

    return (
        <Row gap={8}>
            <Input
                placeholder="https://example.com"
                value={value}
                onChange={event => setValue(event.target.value)}
                data-testid="@settings/apps-embedding/custom-url-input"
            />
            <Button
                intent="neutral"
                priority="secondary"
                isDisabled={value.trim().length === 0}
                onClick={handleSubmit}
                data-testid="@settings/apps-embedding/embed-custom-url"
            >
                Embed URL
            </Button>
        </Row>
    );
};
