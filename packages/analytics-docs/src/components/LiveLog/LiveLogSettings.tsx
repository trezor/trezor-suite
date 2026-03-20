import { createPortal } from 'react-dom';

import { Column, Input, Modal, Row, Switch, Text } from '@trezor/components';

import { getDefaultLogServerBaseUrl } from '../../utils/logServerUrl';

type LiveLogSettingsProps = {
    isOpen: boolean;
    logServerInput: string;
    showMetaInPayloadDraft: boolean;
    onLogServerInputChange: (value: string) => void;
    onShowMetaInPayloadChange: (value: boolean) => void;
    onCancel: () => void;
    onApply: () => void;
    onReset: () => void;
};

export const LiveLogSettings = ({
    isOpen,
    logServerInput,
    showMetaInPayloadDraft,
    onLogServerInputChange,
    onShowMetaInPayloadChange,
    onCancel,
    onApply,
    onReset,
}: LiveLogSettingsProps) => {
    if (!isOpen) return null;

    return createPortal(
        <Modal
            heading="Live log settings"
            onCancel={onCancel}
            width={600}
            bottomContent={<Modal.Button onClick={onApply}>Apply</Modal.Button>}
        >
            <Column gap={12} alignItems="stretch">
                <Row gap={8} alignItems="center">
                    <Input
                        size="small"
                        value={logServerInput}
                        onChange={e => onLogServerInputChange(e.target.value)}
                        placeholder="Log server base URL (e.g. https://analytics-log.example.com)"
                        showClearButton
                        onClear={() => onLogServerInputChange('')}
                    />

                    <Modal.Button
                        priority="secondary"
                        intent="critical"
                        onClick={onReset}
                        size="medium"
                    >
                        Reset
                    </Modal.Button>
                </Row>
                <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                    This controls where analytics-docs connects for live events (SSE) and where
                    Suite should send events to{' '}
                    <Text isMonospaced typographyStyle="inherit">
                        {`${(logServerInput.trim() || getDefaultLogServerBaseUrl()).replace(/\/+$/, '')}/log`}
                    </Text>
                    .
                </Text>
                <Switch
                    isChecked={showMetaInPayloadDraft}
                    onChange={onShowMetaInPayloadChange}
                    label="Show metadata in payload table"
                />
            </Column>
        </Modal>,
        document.body,
    );
};
