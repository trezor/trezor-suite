import { type MouseEventHandler } from 'react';

import { LearnMoreButton } from '@suite/external-links';
import { Button, Paragraph, Row } from '@trezor/components';
import { type Url } from '@trezor/urls';

type ButtonProps = { onClick: MouseEventHandler<HTMLButtonElement>; text: string };

export type InputErrorProps = {
    buttonProps?: ButtonProps;
    learnMoreUrl?: Url;
    message?: string;
};

export const InputError = ({ buttonProps, learnMoreUrl, message }: InputErrorProps) => (
    <Row gap={8} justifyContent="space-between" flex="1">
        <Row gap={8}>
            <Paragraph>{message}</Paragraph>
            {learnMoreUrl && <LearnMoreButton url={learnMoreUrl} />}
        </Row>
        {buttonProps?.text && (
            <Button
                size="small"
                intent="neutral"
                priority="secondary"
                onClick={buttonProps.onClick}
            >
                {buttonProps.text}
            </Button>
        )}
    </Row>
);
