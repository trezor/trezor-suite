import { MouseEventHandler } from 'react';

import { Button, Paragraph, Row } from '@trezor/components';
import { Url } from '@trezor/urls';
import { spacings } from '@trezor/theme';

import { LearnMoreButton } from '../suite/LearnMoreButton';

type ButtonProps = { onClick: MouseEventHandler<HTMLButtonElement>; text: string };
type LinkProps = { url: Url };

export type InputErrorProps = {
    button?: ButtonProps | LinkProps;
    message?: string;
};

export const InputError = ({ button, message }: InputErrorProps) => (
    <Row gap={spacings.xs} justifyContent="space-between" flex="1">
        <Paragraph>{message}</Paragraph>
        {button &&
            ('url' in button ? (
                <LearnMoreButton url={button.url} />
            ) : (
                <Button size="tiny" variant="tertiary" onClick={button.onClick} textWrap={false}>
                    {button.text}
                </Button>
            ))}
    </Row>
);
