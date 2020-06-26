import React, { useEffect } from 'react';
import { MenuListComponentProps, createFilter } from 'react-select';

import styled, { keyframes } from 'styled-components';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import messages from '@suite/support/messages';
import { Select, variables } from '@trezor/components';
import { BIP_39 } from '@suite-constants';
import { FixedSizeList as List } from 'react-window';

const options = BIP_39.map(item => ({ label: item, value: item }));

const shake = keyframes`
    10%, 90% {
        transform: translate3d(-1px, 0, 0);
    }

    20%, 80% {
        transform: translate3d(2px, 0, 0);
    }

    30%, 50%, 70% {
        transform: translate3d(-4px, 0, 0);
    }

    40%, 60% {
        transform: translate3d(4px, 0, 0);
    }
`;

const SelectWrapper = styled.div`
    animation: ${shake} 1.3s;
    margin: 12px auto;
    min-height: 230px;
    text-align: left;

    width: 380px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        width: 280px;
    }
`;

type Option = { label: string; value: string };

const MenuList = (props: MenuListComponentProps<Option>) => {
    const children = React.Children.toArray(props.children);
    return (
        <List height={32 * 5} itemCount={children.length} itemSize={32} width="100%">
            {({ index, style }) => <div style={style}>{children[index]}</div>}
        </List>
    );
};

interface Props extends WrappedComponentProps {
    onSubmit: (word: string) => void;
}

const WordInput = (props: Props) => {
    const { onSubmit } = props;

    useEffect(() => {
        const keyboardHandler = (event: KeyboardEvent) => {
            // 13 enter, 9 tab
            if (event.keyCode === 13 || event.keyCode === 9) {
                return onSubmit;
            }
        };
        window.addEventListener('keydown', keyboardHandler, false);
        return () => {
            window.removeEventListener('keydown', keyboardHandler, false);
        };
    }, [onSubmit]);

    return (
        <SelectWrapper>
            <Select
                autoFocus
                isSearchable
                isClearable={false}
                maxMenuHeight={180}
                controlShouldRenderValue={false}
                noOptionsMessage={({ inputValue }: { inputValue: string }) =>
                    props.intl.formatMessage(messages.TR_WORD_DOES_NOT_EXIST, { word: inputValue })
                }
                onChange={(item: any) => {
                    onSubmit(item.value);
                }}
                components={{ MenuList }}
                placeholder={props.intl.formatMessage(messages.TR_CHECK_YOUR_DEVICE)}
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
};

export default injectIntl(WordInput);
