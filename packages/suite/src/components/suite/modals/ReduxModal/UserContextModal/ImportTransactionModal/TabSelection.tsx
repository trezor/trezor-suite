import { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { variables } from '@trezor/components';

const TabSelector = styled.div`
    width: 100%;
    text-align: left;
    margin-bottom: 16px;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
`;

const TabButton = styled.button<{ selected: boolean }>`
    border: none;
    background-color: inherit;
    font-size: ${variables.NEUE_FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding-top: 12px;
    padding-bottom: 12px;
    margin-right: 40px;
    cursor: pointer;

    /* change styles if the button is selected */
    color: ${({ selected, theme }) =>
        selected ? `${theme.TYPE_GREEN}` : `${theme.TYPE_LIGHT_GREY}`};
    border-bottom: ${({ selected, theme }) => (selected ? `2px solid ${theme.BG_GREEN}` : 'none')};

    :hover {
        border-bottom: 2px solid ${({ theme, selected }) => !selected && theme.STROKE_GREY};
    }
`;

export type TabId = 'upload' | 'form';

export interface TabSelectionProps {
    selectedTab: TabId;
    setSelectedTab: Dispatch<SetStateAction<TabId>>;
}

export const TabSelection = ({ selectedTab, setSelectedTab }: TabSelectionProps) => (
    <TabSelector>
        <TabButton selected={selectedTab === 'upload'} onClick={() => setSelectedTab('upload')}>
            <Translation id="TR_IMPORT_CSV_FROM_FILE" />
        </TabButton>

        <TabButton selected={selectedTab === 'form'} onClick={() => setSelectedTab('form')}>
            <Translation id="TR_IMPORT_CSV_FROM_TEXT" />
        </TabButton>
    </TabSelector>
);
