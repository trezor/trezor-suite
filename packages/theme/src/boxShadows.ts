export const boxShadows = {
    small: '0px 2px 4px rgba(0, 0, 0, 0.04)',
    // TODO: next shadows needs to be defined
    medium: '0px 2px 4px rgba(0, 0, 0, 0.04)',
    big: '0px 2px 4px rgba(0, 0, 0, 0.04)',
};

export type BoxShadow = keyof typeof boxShadows;
export type BoxShadows = typeof boxShadows;

interface NativeBoxShadowDefinition {
    elevation: number;
    shadowColor: string;
    shadowOffset: {
        height: number;
        width: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
}

export const nativeBoxShadows: Record<string, NativeBoxShadowDefinition> = {
    small: {
        elevation: 4,
        shadowColor: '#rgba(0, 0, 0, 0.04)',
        shadowOffset: {
            height: 0,
            width: 0,
        },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    // TODO: next shadows needs to be defined
    medium: {
        elevation: 4,
        shadowColor: '#rgba(0, 0, 0, 0.04)',
        shadowOffset: {
            height: 0,
            width: 0,
        },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    big: {
        elevation: 4,
        shadowColor: '#rgba(0, 0, 0, 0.04)',
        shadowOffset: {
            height: 0,
            width: 0,
        },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
};

export type NativeBoxShadow = keyof typeof nativeBoxShadows;
export type NativeBoxShadows = Record<NativeBoxShadow, NativeBoxShadowDefinition>;
