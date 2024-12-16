import { MouseEventHandler } from 'react';

import { Button, Paragraph, Row } from '@trezor/components';
import { Url } from '@trezor/urls';
import { spacings } from '@trezor/theme';

import { LearnMoreButton } from '../suite/LearnMoreButton';

type ButtonProps = { onClick: MouseEventHandler<HTMLButtonElement>; text: string };

export type InputErrorProps = {
    buttonProps?: ButtonProps;
    learnMoreUrl?: Url;
    message?: string;
};

export const InputError = ({ buttonProps, learnMoreUrl, message }: InputErrorProps) => (
    <Row gap={spacings.xs} justifyContent="space-between" flex="1">
        <Row gap={spacings.xs}>
            <Paragraph>{message}</Paragraph>
            {learnMoreUrl && <LearnMoreButton url={learnMoreUrl} />}
        </Row>
        {buttonProps?.text && (
            <Button size="tiny" variant="tertiary" onClick={buttonProps.onClick}>
                {buttonProps.text}
            </Button>
        )}
    </Row>
);
