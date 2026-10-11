import { useFormatters } from '@suite-common/formatters';
import { Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type OlderHistoryStatusProps = {
    /** Unix time of the oldest block the loaded direct-RPC history covers. */
    historyCoveredSince?: number;
    hasLoadingFailed: boolean;
};

// A step back can find nothing, so the date the list reaches is what shows the press worked.
export const OlderHistoryStatus = ({
    historyCoveredSince,
    hasLoadingFailed,
}: OlderHistoryStatusProps) => {
    const { DateTimeFormatter } = useFormatters();

    return (
        <>
            {historyCoveredSince !== undefined && (
                <Text variant="body-sm" color="contentSecondary" textAlign="center">
                    <Translation
                        id="transactions.historyCoveredSince"
                        values={{ date: DateTimeFormatter.format(historyCoveredSince * 1000) }}
                    />
                </Text>
            )}
            {hasLoadingFailed && (
                <Text variant="body-sm" color="contentCritical" textAlign="center">
                    <Translation id="transactions.loadOlderFailed" />
                </Text>
            )}
        </>
    );
};
