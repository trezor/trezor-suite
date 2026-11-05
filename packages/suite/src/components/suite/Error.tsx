import { type ReactNode } from 'react';

import { injectReloadApp } from '@suite-common/suite-types';
import { Button, Column, Divider, H2, Paragraph, Row } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { RepeatIcon } from '@trezor/icons';

import { injectDb } from 'src/storage/createDb';

type ErrorProps = {
    error: string;
    actions?: ReactNode;
};

export const Error = ({ error, actions }: ErrorProps) => {
    const { reloadApp, db } = useServices(injectReloadApp, injectDb);

    return (
        <Column
            flex="1"
            alignItems="center"
            justifyContent="center"
            padding={20}
            maxWidth="800px"
            width="100%"
        >
            <H2>Error occurred</H2>
            <Paragraph margin={{ bottom: 8 }} align="center">
                It appears something is broken.
            </Paragraph>
            <Paragraph align="center" typographyStyle="body-xs" isMonospaced>
                {error}
            </Paragraph>
            <Divider margin={{ vertical: 24 }} />
            <Row width="100%" justifyContent="center" gap={16} flexWrap="wrap">
                <Button
                    iconLeft={RepeatIcon}
                    intent="neutral"
                    priority="secondary"
                    onClick={() => {
                        reloadApp();
                    }}
                >
                    Reload window
                </Button>

                {actions}

                <Button
                    iconLeft={RepeatIcon}
                    intent="neutral"
                    priority="secondary"
                    onClick={() => {
                        db.removeDatabase();
                        reloadApp();
                    }}
                >
                    Clear storage and reload
                </Button>
            </Row>
        </Column>
    );
};
