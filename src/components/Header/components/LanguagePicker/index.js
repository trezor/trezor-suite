/* @flow */
import * as React from 'react';
import styled from 'styled-components';
import colors from 'config/colors';
import ReactSelect from 'react-select';
import { LANGUAGE, SCREEN_SIZE } from 'config/variables';

import type { Props } from './Container';

const SelectWrapper = styled.div`
    display: flex;
    color: ${colors.WHITE};
    align-items: center;
    width: 180px;

    @media screen and (max-width: ${SCREEN_SIZE.MD}) {
        width: 140px;
    }

    @media screen and (max-width: ${SCREEN_SIZE.XS}) {
        width: 100px;
    }
`;

const SelectIcon = styled.span`
    margin-right: -24px;
    padding-left: 6px;
    display: flex;
`;

const styles = {
    singleValue: base => ({
        ...base,
        color: colors.WHITE,
        paddingLeft: '25px', // flag
    }),
    control: base => ({
        ...base,
        height: '40px',
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
        cursor: 'pointer',
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    container: base => ({
        ...base,
        width: '100%',
    }),
    dropdownIndicator: () => ({
        display: 'block',
        marginTop: '3px',
    }),
    menu: base => ({
        ...base,
        color: colors.WHITE,
        marginTop: '6px',
        boxShadow: 'none',
    }),
    menuList: base => ({
        ...base,
        padding: 0,
        boxShadow: 'none',
        background: colors.WHITE,
        borderLeft: `1px solid ${colors.DIVIDER}`,
        borderRight: `1px solid ${colors.DIVIDER}`,
        borderBottom: `1px solid ${colors.DIVIDER}`,
    }),
    option: (base, { isFocused }) => ({
        ...base,
        color: colors.TEXT_SECONDARY,
        background: isFocused ? colors.LANDING : colors.WHITE,
        borderRadius: 0,
        '&:hover': {
            cursor: 'pointer',
            background: colors.LANDING,
        },
    }),
};

const buildOption = langCode => {
    const lang = LANGUAGE.find(l => l.code === langCode);
    return { value: lang.code, label: lang.name };
};

const LanguagePicker = ({ language, fetchLocale }: Props) => (
    <SelectWrapper>
        <SelectIcon role="img" aria-label="Select language">
            <svg width="21" height="15">
                <image xlinkHref={`l10n/flags/${language}.svg`} width="21" height="15" />
            </svg>
        </SelectIcon>
        <ReactSelect
            styles={styles}
            isSearchable={false}
            isClearable={false}
            onChange={option => fetchLocale(option.value)}
            value={buildOption(language)}
            options={LANGUAGE.map(lang => buildOption(lang.code))}
        />
    </SelectWrapper>
);

export default LanguagePicker;
