import { Card, Column, Paragraph, Row, Text } from '@trezor/components';

import { CopyButton } from './CopyButton';
import { ResultStepCard } from './ResultStepCard';

type EventGenerateResultProps = {
    isEditing: boolean;
    filePath: string;
    constantsFilePath: string;
    eventsIndexPath: string;
    enumSnippet: string;
    enumContextSnippet: string;
    generatedCode: string;
    eventsIndexExportSnippet: string;
    usageExampleSnippet: string;
};

export const EventGenerateResult = ({
    isEditing,
    filePath,
    constantsFilePath,
    eventsIndexPath,
    enumSnippet,
    enumContextSnippet,
    generatedCode,
    eventsIndexExportSnippet,
    usageExampleSnippet,
}: EventGenerateResultProps) => (
    <Column gap={16}>
        {!isEditing && (
            <ResultStepCard
                title="1. Add to EventType enum"
                description={
                    <>
                        In <Text isMonospaced>{constantsFilePath}</Text>, add your entry inside the
                        enum, e.g.:
                    </>
                }
                copyText={enumSnippet}
                copyLabel="Copy enum line"
                codeContent={enumContextSnippet}
            />
        )}

        <Card paddingType="normal">
            <Column gap={8}>
                <Text typographyStyle="body-md">
                    {isEditing ? 'File path' : '2. Create new file'}
                </Text>
                <Row alignItems="center" justifyContent="space-between" gap={8}>
                    <Text isMonospaced typographyStyle="body-md-strong">
                        {filePath}
                    </Text>
                    <CopyButton textToCopy={filePath} copyLabel="Copy path" />
                </Row>
                {isEditing && (
                    <Text typographyStyle="body-sm">
                        Replace the existing file with the generated content below.
                    </Text>
                )}
            </Column>
        </Card>

        <Card paddingType="normal">
            <Column gap={8}>
                <Text typographyStyle="body-md">
                    {isEditing ? 'Generated file content' : '3. Put this content in the file'}
                </Text>
                <Row justifyContent="flex-end" alignItems="center">
                    <CopyButton textToCopy={generatedCode} copyLabel="Copy code" />
                </Row>
                <Card paddingType="normal">
                    <div
                        style={{
                            overflow: 'auto',
                            maxHeight: 360,
                            whiteSpace: 'pre',
                        }}
                    >
                        <Paragraph isMonospaced typographyStyle="body-xs">
                            {generatedCode}
                        </Paragraph>
                    </div>
                </Card>
            </Column>
        </Card>

        {!isEditing && eventsIndexExportSnippet && (
            <ResultStepCard
                title="4. Add to index"
                description={
                    <>
                        In <Text isMonospaced>{eventsIndexPath}</Text>, add:
                    </>
                }
                copyText={eventsIndexExportSnippet}
                copyLabel="Copy export line"
                codeContent={eventsIndexExportSnippet}
            />
        )}

        {!isEditing && usageExampleSnippet && (
            <ResultStepCard
                title="5. Ready to use"
                description="Example inside your component:"
                copyText={usageExampleSnippet}
                copyLabel="Copy example"
                codeContent={usageExampleSnippet}
            />
        )}
    </Column>
);
