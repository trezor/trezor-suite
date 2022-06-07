import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, useColorScheme, View } from 'react-native';

import { Icon, CryptoIcon, FlagIcon } from '@trezor/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import {
    Text,
    Box,
    Button,
    NumPadButton,
    Hint,
    SearchInput,
    Radio,
    CheckBox,
    Chip,
    Switch,
    ListItem,
    SelectableListItem,
    BottomModal,
    TipToast,
    IconButton,
    Select,
    SelectItemType,
} from '@suite-native/atoms';
import { TypographyStyle } from '@trezor/theme';

const backgroundStyle = prepareNativeStyle<{ isDarkMode: boolean }>(
    ({ colors, spacings }, { isDarkMode }) => ({
        backgroundColor: isDarkMode ? colors.black : colors.white,
        padding: spacings.medium,
        marginTop: 0,
        flex: 1,
    }),
);

const typographyItems: TypographyStyle[] = [
    'titleLarge',
    'titleMedium',
    'titleSmall',
    'highlight',
    'body',
    'callout',
    'hint',
    'label',
];
const selectItems: SelectItemType[] = [
    { label: 'Czech Republic', value: 'cz', iconName: 'cz' },
    { label: 'Slovak Republic', value: 'sk', iconName: 'cz' },
    { label: 'Armenian Republic of Kongo', value: 'arm', iconName: 'cz' },
];

export const DemoScreen = () => {
    const isDarkMode = useColorScheme() === 'dark';
    const [inputText, setInputText] = useState<string>('');
    const { applyStyle } = useNativeStyles();
    const [radioChecked, setRadioChecked] = useState<string>('second');
    const [isCheckBox1Checked, setIsCheckBox1Checked] = useState(false);
    const [isCheckBox2Checked, setIsCheckBox2Checked] = useState(true);
    const [isCheckBox3Checked, setIsCheckBox3Checked] = useState(false);
    const [isCheckBox4Checked, setIsCheckBox4Checked] = useState(true);
    const [isChip1Selected, setIsChip1Selected] = useState<boolean>(false);
    const [isChip2Selected, setIsChip2Selected] = useState<boolean>(false);
    const [isSwitchActive, setIsSwitchActive] = useState<boolean>(true);
    const [isSwitch2Active, setIsSwitch2Active] = useState<boolean>(false);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [isTipToastVisible, setIsTipToastVisible] = useState<boolean>(true);
    const [selectedItem, setSelectedItem] = useState<SelectItemType | null>(null);

    const handleRadioPress = (value: string | number) => {
        setRadioChecked(value.toString());
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
                    <Box>
                        <IconButton
                            size="small"
                            colorScheme="gray"
                            iconName="check"
                            onPress={() => console.log('press icon button')}
                        />
                        <IconButton
                            iconName="check"
                            isRounded
                            onPress={() => console.log('press icon button')}
                        />
                        <IconButton
                            size="large"
                            iconName="check"
                            isRounded
                            onPress={() => console.log('press icon button')}
                        />
                    </Box>
                    <Box marginTop="medium">
                        <Select
                            items={selectItems}
                            selectedItem={selectedItem}
                            setSelectedItem={setSelectedItem}
                            label="Open Select"
                        />
                    </Box>
                    <Box marginTop="large">
                        <FlagIcon name="cz" />
                        <Chip
                            icon={<CryptoIcon name="btc" />}
                            title="Bitcoin"
                            isSelected={isChip1Selected}
                            onSelect={() => setIsChip1Selected(!isChip1Selected)}
                        />
                        <Chip
                            icon={<CryptoIcon name="btc" />}
                            title="Bitcoin"
                            isSelected={isChip2Selected}
                            onSelect={() => setIsChip2Selected(!isChip2Selected)}
                            description="inc Tokens"
                        />
                    </Box>
                    <Box marginTop="large">
                        {isTipToastVisible && (
                            <TipToast
                                title="TIP"
                                description="Tip toast"
                                onClose={() => setIsTipToastVisible(false)}
                            />
                        )}
                    </Box>
                    <Box marginTop="large">
                        <Text variant="titleLarge">Title Large</Text>
                    </Box>
                    <Box>
                        <Text variant="titleMedium">Title Medium</Text>
                    </Box>
                    <Switch
                        isChecked={isSwitchActive}
                        onChange={() => setIsSwitchActive(!isSwitchActive)}
                    />
                    <Switch
                        isChecked={isSwitch2Active}
                        onChange={() => setIsSwitch2Active(!isSwitch2Active)}
                        isDisabled
                    />
                    <Button onPress={() => setIsModalVisible(true)}>Show Typograhy</Button>
                    <BottomModal
                        isVisible={isModalVisible}
                        onVisibilityChange={setIsModalVisible}
                        title="Typography Demo"
                        hasBackArrow
                        onBackArrowClick={() => setIsModalVisible(!isModalVisible)}
                    >
                        {typographyItems.map(item => (
                            <Box marginTop="small" key={item}>
                                <Text variant={item}>{item}</Text>
                            </Box>
                        ))}
                    </BottomModal>
                    <Box marginVertical="medium">
                        <Text>Icon:</Text>
                        <Icon name="warningCircle" size="large" color="black" />
                    </Box>
                    <Box marginVertical="medium">
                        <Text>Hints:</Text>
                        <Hint variant="hint">Hned to mažem</Hint>
                        <Hint variant="error">Please enter a valid address dumbo</Hint>
                    </Box>
                    <Box marginVertical="medium">
                        <Button onPress={() => console.log('Get features')}>My Fancy Button</Button>
                    </Box>
                    <Box marginVertical="medium">
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
                    <Box marginVertical="medium">
                        <Text>Checkbox:</Text>
                        <Box flexDirection="row" justifyContent="space-between">
                            <CheckBox
                                isChecked={isCheckBox1Checked}
                                onChange={() => setIsCheckBox1Checked(!isCheckBox1Checked)}
                            />
                            <CheckBox
                                isChecked={isCheckBox2Checked}
                                onChange={() => setIsCheckBox2Checked(!isCheckBox2Checked)}
                            />
                            <CheckBox
                                isChecked={isCheckBox3Checked}
                                onChange={() => setIsCheckBox3Checked(!isCheckBox3Checked)}
                                isDisabled
                            />
                            <CheckBox
                                isChecked={isCheckBox4Checked}
                                onChange={() => setIsCheckBox4Checked(!isCheckBox4Checked)}
                                isDisabled
                            />
                        </Box>
                    </Box>

                    <NumPadButton
                        value={5}
                        onPress={value =>
                            console.log('Press num pad button. No implementation yet.', value)
                        }
                    />
                    <Button onPress={() => console.log('Get features to be implemented')}>
                        Get features
                    </Button>
                    <Box marginVertical="medium">
                        <ListItem
                            iconName="placeholder"
                            title="Headline"
                            subtitle="Description of that headline"
                            hasRightArrow
                            onPress={() => console.log('Press ListItem. No implementation yet.')}
                        />
                    </Box>
                    <Box marginVertical="medium">
                        <ListItem
                            iconName="warningCircle"
                            title="Some Really and I mean really Long Headline without isTextWrapped"
                            hasRightArrow
                            isTextTruncated
                        />
                    </Box>
                    <Box marginVertical="medium">
                        <ListItem
                            title="Headline"
                            subtitle="Description of that headline"
                            hasRightArrow
                        />
                    </Box>
                    <Box marginVertical="medium">
                        <ListItem
                            iconName="warningCircle"
                            title="Some Really and I mean really really Long Headline"
                            subtitle="Description of that headlineDescription of that headlineDescription of that headlineDescription of that headline"
                            hasRightArrow={false}
                        />
                    </Box>
                    <Box marginVertical="medium">
                        <ListItem
                            iconName="placeholder"
                            title="Not wrapped example with long and I mean really long Headline"
                            subtitle="Description of that not wrapped example with long and I mean really long Headline"
                            hasRightArrow
                            isTextTruncated
                        />
                    </Box>
                    <Box marginVertical="medium">
                        <SelectableListItem
                            iconName="placeholder"
                            title="Headline"
                            subtitle="Description of that headline"
                            onPress={handleRadioPress}
                            value="firstSelectable"
                            isChecked={radioChecked === 'firstSelectable'}
                        />
                    </Box>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
