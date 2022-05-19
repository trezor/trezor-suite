import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, useColorScheme, View } from 'react-native';

import {
    Text,
    Box,
    Button,
    NumPadButton,
    Icon,
    Hint,
    SearchInput,
    Radio,
    Chip,
} from '@trezor/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const backgroundStyle = prepareNativeStyle<{ isDarkMode: boolean }>(
    ({ colors, spacings }, { isDarkMode }) => ({
        backgroundColor: isDarkMode ? colors.black : colors.white,
        padding: spacings.lg,
        marginTop: 0,
    }),
);

export const Home = () => {
    const isDarkMode = useColorScheme() === 'dark';
    const [inputText, setInputText] = useState<string>('');
    const { applyStyle } = useNativeStyles();
    const [radioChecked, setRadioChecked] = useState('second');
    const [isChipSelected, setIsChipSelected] = useState<boolean>(false);

    const handleRadioPress = (value: string) => {
        setRadioChecked(value);
    };

    return (
        <SafeAreaView style={applyStyle(backgroundStyle, { isDarkMode })}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <ScrollView
                contentInsetAdjustmentBehavior="automatic"
                style={applyStyle(backgroundStyle, { isDarkMode })}
            >
                <View>
                    <SearchInput
                        value={inputText}
                        onChange={setInputText}
                        placeholder="Type here.."
                    />
                    <Box marginTop="lg">
                        <Text variant="titleLarge">Title Large</Text>
                    </Box>
                    <Box>
                        <Text variant="titleMedium">Title Medium</Text>
                    </Box>
                    <Box>
                        <Text variant="titleSmall">Title Small</Text>
                    </Box>
                    <Box>
                        <Text variant="highlight">Highlight</Text>
                    </Box>
                    <Box>
                        <Text variant="body">Body</Text>
                    </Box>
                    <Box>
                        <Text variant="callout">Callout</Text>
                    </Box>
                    <Box>
                        <Text variant="hint">Hint</Text>
                    </Box>
                    <Box>
                        <Text variant="label">Label</Text>
                    </Box>
                    <Box marginVertical="md">
                        <Text>Icon:</Text>
                        <Icon type="warningCircle" size="big" color="black" />
                    </Box>
                    <Box marginVertical="md">
                        <Text>Hints:</Text>
                        <Hint variant="hint">Hned to mažem</Hint>
                        <Hint variant="error">Please enter a valid address dumbo</Hint>
                    </Box>
                    <Box marginVertical="md">
                        <Button onPress={() => {}} size="md" colorScheme="primary">
                            My Fancy Button
                        </Button>
                    </Box>
                    <Box marginVertical="md">
                        <Text>Radio:</Text>
                        <Box flexDirection="row" justifyContent="space-between">
                            <Radio
                                key="first"
                                value="first"
                                onPress={handleRadioPress}
                                isChecked={radioChecked === 'first'}
                            />
                            <Radio
                                key="second"
                                value="second"
                                onPress={handleRadioPress}
                                isChecked={radioChecked === 'second'}
                            />
                            <Radio
                                key="third"
                                value="third"
                                onPress={handleRadioPress}
                                isDisabled
                            />
                            <Radio
                                key="fourth"
                                value="fourth"
                                onPress={handleRadioPress}
                                isChecked
                                isDisabled
                            />
                        </Box>
                    </Box>

                    <Chip
                        icon={<Icon type="search" size="big" />}
                        title="Bitcoin"
                        isSelected={isChipSelected}
                        onSelect={() => setIsChipSelected(!isChipSelected)}
                    />
                    <Chip
                        icon={<Icon type="search" size="big" />}
                        title="Bitcoin"
                        isSelected={isChipSelected}
                        onSelect={() => setIsChipSelected(!isChipSelected)}
                        // hint={<Hint />}
                    />
                    <NumPadButton
                        value={5}
                        onPress={value =>
                            console.log('Press num pad button. No implementation yet.', value)
                        }
                    />
                    <Button
                        onPress={() => console.log('Get features to be implemented')}
                        size="md"
                        colorScheme="primary"
                    >
                        Get features
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
