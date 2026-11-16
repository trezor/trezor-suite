import { useSelector } from 'react-redux';

import { Card, TitleHeader, VStack } from '@suite-native/atoms';
import { getPresenceDiagnosticsRows, selectPresenceDiagnostics } from '@suite-native/regions';

export const PresenceDetectionCard = () => {
    const diagnostics = useSelector(selectPresenceDiagnostics);

    return (
        <Card>
            <VStack spacing="sp12">
                <TitleHeader title="Presence detection" />
                {getPresenceDiagnosticsRows(diagnostics).map(({ label, value }) => (
                    <TitleHeader key={label} title={label} titleSpacing="sp1" subtitle={value} />
                ))}
            </VStack>
        </Card>
    );
};
