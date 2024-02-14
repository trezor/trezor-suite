import { useState } from 'react';
import styled from 'styled-components';
import { Card, variables } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { getRandomNumberInRange } from '@trezor/utils';

const NoResults = styled(Card)`
    display: flex;
    text-align: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Examples = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 12px;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-style: italic;
`;

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
    const [tip] = useState(getRandomNumberInRange(1, 10));

    return (
        <NoResults>
            <Translation id="TR_NO_SEARCH_RESULTS" />

            <Examples>
                <Translation
                    id={getTip(tip)}
                    values={{
                        strong: chunks => <strong>{chunks}</strong>, // search string is wrapped in strong tag for additional styling
                        lastYear: new Date().getFullYear() - 1,
                    }}
                />
            </Examples>
        </NoResults>
    );
};
