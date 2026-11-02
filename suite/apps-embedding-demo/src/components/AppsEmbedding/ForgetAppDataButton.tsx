import { Button, Column, Text } from '@trezor/components';

import { useForgetAppData } from './hooks/useForgetAppData';

type ForgetAppDataButtonProps = {
    entryId: string;
};

/**
 * Clears the on-disk session of an app that keeps its data between restarts.
 *
 * It lives on the catalog row rather than in the embedding toolbar on purpose: with nothing open
 * there is no page to have its storage rewritten from memory a tick later, and no payment sheet to
 * lose its credentials halfway through.
 */
export const ForgetAppDataButton = ({ entryId }: ForgetAppDataButtonProps) => {
    const { isPending, isSuccess, error, mutate: forgetAppData } = useForgetAppData();

    return (
        <Column gap={4} alignItems="flex-end">
            <Button
                size="small"
                intent="critical"
                priority="secondary"
                isLoading={isPending}
                isDisabled={isPending}
                onClick={() => forgetAppData(entryId)}
                data-testid={`@settings/apps-embedding/forget/${entryId}`}
            >
                {isSuccess ? 'Data forgotten' : 'Forget data'}
            </Button>

            {error && (
                <Text intent="critical" typographyStyle="body-xs">
                    {error.message}
                </Text>
            )}
        </Column>
    );
};
