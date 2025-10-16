import { MouseEventHandler } from 'react';

import { NewButton, Paragraph, Row } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { Url } from '@trezor/urls';

import { LearnMoreButton } from '../suite/LearnMoreButton';

type NewButtonProps = { onClick: MouseEventHandler<HTMLButtonElement>; text: string };

export type InputErrorProps = {
    buttonProps?: NewButtonProps;
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
            <NewButton
                size="small"
                intent="neutral"
                priority="secondary"
                onClick={buttonProps.onClick}
            >
                {buttonProps.text}
            </NewButton>
        )}
    </Row>
);
