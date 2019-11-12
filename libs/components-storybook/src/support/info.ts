import { colors, variables } from '@trezor/components';

export const infoOptions = {
    header: false,
    inline: true,
    maxPropsIntoLine: 1,
    styles: {
        infoStory: {
            background: colors.LANDING,
            borderBottom: `1px solid ${colors.DIVIDER}`,
            padding: '30px',
        },
        infoBody: {
            border: 'none',
            padding: '15px',
            fontFamily: variables.FONT_FAMILY.DEFAULT,
            h2: {
                color: 'red',
                fontFamily: variables.FONT_FAMILY.DEFAULT,
                marginBottom: '15px',
            },
        },
        info: {
            border: 'none',
            padding: '15px',
            fontFamily: variables.FONT_FAMILY.DEFAULT,
        },
        source: {
            fontFamily: variables.FONT_FAMILY.DEFAULT,
            h1: {
                color: colors.TEXT,
                fontWeight: 500,
            },
            h3: {
                color: colors.TEXT,
                fontSize: '12px',
            },
            pre: {
                fontFamily: variables.FONT_FAMILY.MONOSPACE,
            },
        },
        propTableHead: {
            color: colors.TEXT,
            fontWeight: 500,
        },
    },
};
