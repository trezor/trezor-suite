import { useEffect, useRef, memo, Children, ReactElement } from 'react';
import { FixedSizeList as List } from 'react-window';
import { MenuListProps, SelectInstance, createFilter } from 'react-select';
import styled from 'styled-components';
import { Select, variables } from '@trezor/components';
import { bip39 } from '@trezor/crypto-utils';
import { useTranslation } from 'src/hooks/suite/useTranslation';
import { useKeyPress } from 'react-use';
import TrezorConnect, { UI } from '@trezor/connect';
import { createTimeoutPromise } from '@trezor/utils';

const options = bip39.map(item => ({ label: item, value: item }));

const SelectWrapper = styled.div`
    margin: 12px auto 0;
    text-align: left;

    width: 380px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 280px;
    }
`;

const StyledList = styled(List)`
    padding: 8px;
    position: static !important;

    > div {
        position: relative;
    }
`;

type Option = { label: string; value: string };

const MenuList = (props: MenuListProps<Option, boolean>) => {
    const listRef = useRef<List>(null);

    const children = Children.toArray(props.children) as ReactElement[];
    const [arrowDownPress] = useKeyPress('ArrowDown');
    const [arrowUpPress] = useKeyPress('ArrowUp');

    useEffect(() => {
        // fix scroll on arrows
        if (listRef.current && (arrowDownPress || arrowUpPress)) {
            const currentIndex = children.findIndex(child => child.props.isFocused === true);

            listRef.current.scrollToItem(currentIndex);
        }
    }, [children, arrowDownPress, arrowUpPress]);

    return (
        <StyledList
            ref={listRef}
            height={34 * 5 + 8}
            itemCount={children.length}
            itemSize={34}
            width="100%"
        >
            {({ index, style }) => <div style={style}>{children[index]}</div>}
        </StyledList>
    );
};

export const WordInput = memo(() => {
    const { translationString } = useTranslation();

    return (
        <SelectWrapper>
            <Select
                autoFocus
                isSearchable
                isClearable={false}
                menuIsOpen
                hideDropdownIndicator
                noOptionsMessage={({ inputValue }: { inputValue: string }) =>
                    translationString('TR_WORD_DOES_NOT_EXIST', { word: inputValue })
                }
                onChange={async (item: Option, ref?: SelectInstance<Option, boolean> | null) => {
                    await createTimeoutPromise(600);
                    TrezorConnect.uiResponse({ type: UI.RECEIVE_WORD, payload: item.value });
                    ref?.clearValue();
                }}
                components={{ MenuList }}
                placeholder={translationString('TR_CHECK_YOUR_DEVICE')}
                options={options}
                filterOption={createFilter({
                    ignoreCase: true,
                    trim: true,
                    matchFrom: 'start',
                })}
                data-test="@word-input-select"
            />
        </SelectWrapper>
    );
});
