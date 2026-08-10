import { EnrichedMarkdownText, type MarkdownStyle } from 'react-native-enriched-markdown';

import { useNativeStyles } from '@trezor/styles-native';

type MarkdownTextProps = {
    markdown: string;
};

export const MarkdownText = ({ markdown }: MarkdownTextProps) => {
    const { utils } = useNativeStyles();

    const color = utils.colors.contentPrimary;

    // Defines only ever used markdown tags. In case there is need for more, define it here.
    const markdownStyle: MarkdownStyle = {
        h1: { ...utils.typography['headline-md'], color },
        h2: { ...utils.typography['headline-sm'], color },
        h3: { ...utils.typography['body-md-strong'], color },
        paragraph: { ...utils.typography['body-sm'], color },
        list: { ...utils.typography['body-sm'], color, bulletSize: 3, bulletColor: color },
    };

    return <EnrichedMarkdownText markdown={markdown} markdownStyle={markdownStyle} />;
};
