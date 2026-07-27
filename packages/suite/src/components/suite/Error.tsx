import { useServices } from '@suite-common/dependency-injection';
import { selectReloadAppDep } from '@suite-common/suite-types';
import { Button, Column, Divider, H2, Paragraph, Row } from '@trezor/components';
import { RepeatIcon } from '@trezor/icons';

import { db } from 'src/storage';

type ErrorProps = {
    error: string;
};

export const Error = ({ error }: ErrorProps) => {
    const { reloadApp } = useServices(selectReloadAppDep);

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
