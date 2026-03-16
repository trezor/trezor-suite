import { Badge, Box, Icon, List, Paragraph, Row } from '@trezor/components';

import { type NormalizedChangelog } from '../types';
import { Markdown } from './Markdown';

type ChangelogProps = {
    children?: NormalizedChangelog;
};

export const Changelog = ({ children }: ChangelogProps) => {
    if (!children) return null;

    return (
        <>
            <Paragraph typographyStyle="body-sm-strong">Changelog</Paragraph>
            <List
                bulletComponent={<Icon name="dotOutline" />}
                bulletGap={4}
                margin={{
                    horizontal: 0,
                    top: 12,
                    bottom: 20,
                }}
            >
                {children.entries.map((entry, i) => (
                    <List.Item key={`${entry.version}-${i}`}>
                        {entry.notes && (
                            <Row gap={8}>
                                <Box minWidth={70}>
                                    <Badge intent="brand" size="small">
                                        {entry.version}
                                    </Badge>
                                </Box>
                                <Markdown>{entry.notes}</Markdown>
                            </Row>
                        )}
                    </List.Item>
                ))}
            </List>
        </>
    );
};
