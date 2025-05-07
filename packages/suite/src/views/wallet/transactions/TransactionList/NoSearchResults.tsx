import { useRef } from 'react';

import { Card, Column, H4, Paragraph, Text } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { getWeakRandomInt } from '@trezor/utils';

import { Translation } from 'src/components/suite';

const getTip = (num: number) => {
    switch (num) {
        case 2:
            return 'TR_TRANSACTIONS_SEARCH_TIP_2';
        case 3:
            return 'TR_TRANSACTIONS_SEARCH_TIP_3';
        case 4:
            return 'TR_TRANSACTIONS_SEARCH_TIP_4';
        case 5:
            return 'TR_TRANSACTIONS_SEARCH_TIP_5';
        case 6:
            return 'TR_TRANSACTIONS_SEARCH_TIP_6';
        case 7:
            return 'TR_TRANSACTIONS_SEARCH_TIP_7';
        case 8:
            return 'TR_TRANSACTIONS_SEARCH_TIP_8';
        case 9:
            return 'TR_TRANSACTIONS_SEARCH_TIP_9';
        case 10:
            return 'TR_TRANSACTIONS_SEARCH_TIP_10';
        default:
            return 'TR_TRANSACTIONS_SEARCH_TIP_1';
    }
};

export const NoSearchResults = () => {
    const tip = useRef(getWeakRandomInt(1, 10));

    return (
        <Card paddingType="none">
            <Column
                alignItems="center"
                gap={spacings.md}
                margin={{ horizontal: 'auto' }}
                padding={spacings.xxxl}
                maxWidth={750}
            >
                <H4 align="center">
                    <Translation id="TR_NO_SEARCH_RESULTS" />
                </H4>
                <Paragraph align="center">
                    <Translation
                        id="TR_TRANSACTIONS_SEARCH_PRO_TIP"
                        values={{
                            strong: chunks => <strong>{chunks}</strong>,
                            span: chunks => (
                                <Text as="code" isHighlighted>
                                    {chunks}
                                </Text>
                            ),
                        }}
                    />
                </Paragraph>
                <Paragraph align="center" variant="tertiary" textWrap="pretty">
                    <Translation
                        id={getTip(tip.current)}
                        values={{
                            strong: chunks => <strong>{chunks}</strong>,
                            span: chunks => (
                                <Text as="code" isHighlighted>
                                    {chunks}
                                </Text>
                            ),
                            lastYear: new Date().getFullYear() - 1,
                        }}
                    />
                </Paragraph>
            </Column>
        </Card>
    );
};
