import { Text } from '@trezor/components';
import { sanitizeName } from '@trezor/connect-common';

type ConnectAppNameProps = {
    appName?: string;
    origin: string;
};

// A grant remembered by an earlier version carries the name unsanitized.
export const ConnectAppName = ({ appName, origin }: ConnectAppNameProps) => {
    const name = sanitizeName(appName);

    if (!name) {
        return <Text overflowWrap="anywhere">{origin}</Text>;
    }

    return (
        <>
            <Text ellipsisLineCount={2} overflowWrap="anywhere">
                {name}
            </Text>
            <Text intent="neutral" priority="secondary" overflowWrap="anywhere">
                {origin}
            </Text>
        </>
    );
};
