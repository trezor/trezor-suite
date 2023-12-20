/* eslint-disable react/no-array-index-key */
/*
If you found yourself here, congratulations! You have found an easter egg.
Merry Christmas and Happy New Year!
*/
import React, { useCallback, useEffect } from 'react';
import { AppState, Dimensions, StyleSheet, TextStyle, View } from 'react-native';

import { Snowflake } from './Snowflake';

const windowHeight = Dimensions.get('window').height + Dimensions.get('window').height * 0.1;

const styles = StyleSheet.create({
    view: {
        flexDirection: 'row',
        zIndex: 9999,
        elevation: 9999,
        position: 'absolute',
        top: 0,
        left: -30,
        width: Dimensions.get('window').width + 30,
        height: windowHeight,
        backgroundColor: 'transparent',
    },
});

const lightSnowflakes = [
    { glyph: '❅', size: 24, offset: '5%', fallDelay: 3000, shakeDelay: 1000 },
    { glyph: '❆', size: 14, offset: '10%', fallDelay: 6000, shakeDelay: 500 },
    { glyph: '❅', size: 18, offset: '15%', fallDelay: 4000, shakeDelay: 2000 },
    { glyph: '❆', size: 24, offset: '25%', fallDelay: 8000, shakeDelay: 3000 },

    { glyph: 'btc', size: 18, offset: '8%', fallDelay: 20000, shakeDelay: 5000 },
];

const isChristmas = () => {
    const date = new Date();
    const month = date.getMonth();
    const day = date.getDate();

    return month === 11 && day > 22 && day < 26;
};

export const Snow: React.FC<{
    snowflakesStyle?: TextStyle;
}> = ({ snowflakesStyle }) => {
    const [letItSnow, setLetItSnow] = React.useState(false);

    const tryToMakeItSnow = useCallback(() => {
        setLetItSnow(false);

        if (isChristmas()) {
            setLetItSnow(true);
        } else {
            setLetItSnow(false);
        }
    }, []);

    useEffect(() => {
        tryToMakeItSnow();
    }, [tryToMakeItSnow]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', tryToMakeItSnow);

        return () => {
            subscription.remove();
        };
    }, [tryToMakeItSnow]);

    if (!letItSnow) return null;

    const snowflakes = lightSnowflakes;

    return (
        <View style={styles.view} pointerEvents="none">
            {snowflakes.map((snowflake, i) => {
                const { offset, fallDelay, shakeDelay, glyph, size } = snowflake;

                return (
                    <Snowflake
                        key={`snowflake-${i}`}
                        glyph={glyph}
                        size={size}
                        offset={offset}
                        fallDelay={fallDelay}
                        shakeDelay={shakeDelay}
                        style={snowflakesStyle}
                    />
                );
            })}
        </View>
    );
};
