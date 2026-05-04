import styled from 'styled-components';

import { type UserContextPayload } from '@suite-common/suite-types';
import { Card, Column, Modal, Paragraph, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

const Pre = styled.pre`
    text-align: left;
    word-break: break-all;
    white-space: pre-wrap;
    font-family: monospace;
`;

type SparkSignerConfirmationModalProps = Omit<
    Extract<UserContextPayload, { type: 'spark-signer-confirmation' }>,
    'type'
> & {
    onCancel: () => void;
};

export const SparkSignerConfirmationModal = ({
    decision,
    methodName,
    onCancel,
    paramsJson,
}: SparkSignerConfirmationModalProps) => {
    const onConfirm = () => {
        decision.resolve(true);
        onCancel();
    };

    const onReject = () => {
        decision.resolve(false);
        onCancel();
    };

    return (
        <Modal
            onCancel={onReject}
            heading="Spark signer confirmation"
            width={680}
            bottomContent={
                <>
                    <Modal.Button onClick={onConfirm}>confirm</Modal.Button>
                    <Modal.Button intent="neutral" priority="secondary" onClick={onReject}>
                        cancel
                    </Modal.Button>
                </>
            }
        >
            <Column gap={spacings.lg}>
                <Column gap={spacings.xxs}>
                    <Paragraph>Method</Paragraph>
                    <Card paddingType="small">
                        <Text typographyStyle="body-xs" as="div">
                            <Pre>{methodName}</Pre>
                        </Text>
                    </Card>
                </Column>

                <Column gap={spacings.xxs}>
                    <Paragraph>Params</Paragraph>
                    <Card paddingType="small">
                        <Text typographyStyle="body-xs" as="div">
                            <Pre>{paramsJson}</Pre>
                        </Text>
                    </Card>
                </Column>
            </Column>
        </Modal>
    );
};
