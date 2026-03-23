import styled from 'styled-components';

import { type ValidateError } from '@suite-common/message-system';
import { Button, Column, Icon, Row, Text, Textarea } from '@trezor/components';
import { useTextareaCursorPosition } from '@trezor/react-utils';
import { spacings } from '@trezor/theme';

const ErrorContainer = styled.div`
    max-height: 16rem;
    overflow-y: scroll;
`;

type MessageSystemJsonEditorProps = {
    value: string;
    isValid: boolean;
    canFormat: boolean;
    errors: ValidateError[];
    onChange: (next: string) => void;
    onFormat: () => void;
    ['data-testid']?: string;
};

export const MessageSystemJsonEditor = ({
    value,
    isValid,
    canFormat,
    errors,
    onChange,
    onFormat,
}: MessageSystemJsonEditorProps) => {
    const { textareaRef, position } = useTextareaCursorPosition();

    return (
        <Row gap={spacings.md} alignItems="flex-start">
            <Textarea
                data-testid="@settings/debug/message-system/json-editor-textarea"
                innerRef={textareaRef}
                label="Message config"
                rows={10}
                value={value}
                hasError={!isValid}
                onChange={e => onChange(e.target.value)}
                bottomText={
                    <Row justifyContent="space-between" alignItems="center">
                        <Text>
                            Line {position.line}, Column {position.column}
                        </Text>
                        <Button
                            isDisabled={!canFormat}
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            onClick={onFormat}
                        >
                            Format JSON
                        </Button>
                    </Row>
                }
            />
            <Column width="50%">
                <Row gap={spacings.xs} margin={{ bottom: spacings.xs }}>
                    {isValid ? (
                        <>
                            <Icon name="checkCircleFilled" intent="brand" size={32} />
                            <span>Config is valid</span>
                        </>
                    ) : (
                        <>
                            <Icon name="xCircleFilled" intent="critical" size={32} />
                            <span>Config is invalid</span>
                        </>
                    )}
                </Row>

                <ErrorContainer>
                    {!isValid && (
                        <Column gap={spacings.xxs}>
                            {errors.map((error, index) => (
                                <Text intent="critical" key={index}>
                                    <strong>{error.field}</strong> {error.message}
                                </Text>
                            ))}
                        </Column>
                    )}
                </ErrorContainer>
            </Column>
        </Row>
    );
};
