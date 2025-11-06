import { ReactNode } from 'react';

import { TranslationKey } from '@suite-common/intl-types';
import { Column, Paragraph, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';

interface AssetsListEmptyProps {
    heading: TranslationKey;
    description?: TranslationKey;
    isEmpty: boolean;
    children: ReactNode;
    height?: string | number;
}

export const AssetsListEmpty = ({
    heading,
    description,
    isEmpty,
    children,
    height,
}: AssetsListEmptyProps) => {
    if (!isEmpty) {
        return <>{children}</>;
    }

    return (
        <Column alignItems="center" justifyContent="center" height={height}>
            <Text typographyStyle="body">
                <Translation id={heading} />
            </Text>
            {description && (
                <Paragraph
                    align="center"
                    maxWidth={280}
                    margin={{
                        top: spacings.xxxs,
                        left: 'auto',
                        right: 'auto',
                    }}
                >
                    <Text variant="tertiary" typographyStyle="hint">
                        <Translation id={description} />
                    </Text>
                </Paragraph>
            )}
        </Column>
    );
};
