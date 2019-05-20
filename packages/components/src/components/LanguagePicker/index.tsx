/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

import React, { CSSProperties } from 'react';
import styled from 'styled-components';
import ReactSelect from 'react-select';
import { State } from 'react-select/lib/Select';

import colors from 'config/colors';
import { SCREEN_SIZE } from 'config/variables';

const SelectWrapper = styled.div`
    display: flex;
    color: ${colors.WHITE};
    align-items: center;
    width: 180px;
    max-width: 100%;

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
    singleValue: (base: CSSProperties) => ({
        ...base,
        color: colors.WHITE,
        paddingLeft: '25px', // flag
    }),
    control: (base: CSSProperties) => ({
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
    container: (base: CSSProperties) => ({
        ...base,
        width: '100%',
    }),
    dropdownIndicator: () => ({
        display: 'block',
        marginTop: '3px',
    }),
    menu: (base: CSSProperties) => ({
        ...base,
        color: colors.WHITE,
        marginTop: '6px',
        boxShadow: 'none',
    }),
    menuList: (base: CSSProperties) => ({
        ...base,
        padding: 0,
        boxShadow: 'none',
        background: colors.WHITE,
        borderLeft: `1px solid ${colors.DIVIDER}`,
        borderRight: `1px solid ${colors.DIVIDER}`,
        borderBottom: `1px solid ${colors.DIVIDER}`,
    }),
    option: (base: CSSProperties, { isFocused }: { isFocused: boolean }) => ({
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

interface Option {
    value: string;
    label: string;
}

const buildOption = (langCode: string, languages: Array<Language>): Option => {
    const lang = languages.find((l: Language) => l.code === langCode);
    if (!lang) {
        throw new Error(`code '${lang}' is not present languages`);
    }
    return { value: lang.code, label: lang.name };
};

interface Language {
    code: string;
    name: string;
    en: string;
}

interface Props {
    language: string;
    onChange: (option: any) => any;
    languages: Array<Language>;
}

const LanguagePicker = ({ language, languages, onChange }: Props) => (
    <SelectWrapper>
        <SelectIcon role="img" aria-label="Select language">
            <svg width="21" height="15">
                <image
                    xlinkHref={require(`../../images/flags/${language}.svg`)}
                    width="21"
                    height="15"
                />
            </svg>
        </SelectIcon>
        <ReactSelect
            styles={styles}
            isSearchable={false}
            isClearable={false}
            onChange={(option: any) => onChange(option)}
            value={buildOption(language, languages)}
            options={languages.map((lang: Language) => buildOption(lang.code, languages))}
        />
    </SelectWrapper>
);

export default LanguagePicker;
