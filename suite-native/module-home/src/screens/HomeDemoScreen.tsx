import React, { useRef, useState } from 'react';
import { TextInput } from 'react-native';

import {
    Text,
    Box,
    Button,
    NumPadButton,
    Hint,
    SearchInput,
    Radio,
    CheckBox,
    Switch,
    ListItem,
    SelectableListItem,
    BottomModal,
    TipToast,
    IconButton,
    Select,
    SelectItemType,
    SelectValue,
    InputWrapper,
    Input,
    VStack,
    TransactionItem,
} from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Screen, StackProps } from '@suite-native/navigation';
import { TypographyStyle } from '@trezor/theme';
import { CryptoIcon, Icon } from '@trezor/icons';

import { HomeStackParamList, HomeStackRoutes } from '../navigation/routes';

const inputStackStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.gray100,
    borderRadius: utils.borders.radii.medium,
    padding: utils.spacings.small,
}));

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
    { label: 'Slovak Republic', value: 'sk', iconName: 'btc' },
    { label: 'Armenian Republic of Kongo', value: 'arm', iconName: 'cz' },
];

export const HomeDemoScreen = ({
    route,
}: StackProps<HomeStackParamList, HomeStackRoutes.HomeDemo>) => {
    const { applyStyle } = useNativeStyles();
    const [input2Text, setInput2Text] = useState<string>('');
    const [input3Text, setInput3Text] = useState<string>('sf51s4afsfwfs8f4');
    const [radioChecked, setRadioChecked] = useState<string>('second');
    const [isCheckBox1Checked, setIsCheckBox1Checked] = useState(false);
    const [isCheckBox2Checked, setIsCheckBox2Checked] = useState(true);
    const [isCheckBox3Checked, setIsCheckBox3Checked] = useState(false);
    const [isCheckBox4Checked, setIsCheckBox4Checked] = useState(true);
    const [isSwitchActive, setIsSwitchActive] = useState<boolean>(true);
    const [isSwitch2Active, setIsSwitch2Active] = useState<boolean>(false);
    const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
    const [isTipToastVisible, setIsTipToastVisible] = useState<boolean>(true);
    const [selectedItem, setSelectedItem] = useState<SelectValue>(null);
    const [inputText, setInputText] = useState<string>('');
    const demoInputRef = useRef<TextInput | null>(null);

    const handleRadioPress = (value: string | number) => {
        setRadioChecked(value.toString());
    };

    return (
        <Screen>
            <Box padding="small">
                <Text>{route.params.message}</Text>
                <Box>
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
                            onPress={() => {}}
                        />
                        <IconButton iconName="check" isRounded onPress={() => {}} />
                        <IconButton size="large" iconName="check" isRounded onPress={() => {}} />
                    </Box>
                    <Box marginTop="medium">
                        <Select
                            items={selectItems}
                            value={selectedItem}
                            onSelectItem={setSelectedItem}
                            selectLabel="Typography"
                        />
                    </Box>
                    <Box marginVertical="medium">
                        <VStack style={applyStyle(inputStackStyle)} spacing="small">
                            <InputWrapper label="Recipient">
                                <Input
                                    ref={demoInputRef}
                                    value={input2Text}
                                    onChange={setInput2Text}
                                    label="To"
                                />
                            </InputWrapper>
                            <InputWrapper>
                                <Input
                                    value={input3Text}
                                    onChange={setInput3Text}
                                    label="From"
                                    leftIcon={<CryptoIcon name="btc" size="extraSmall" />}
                                    hasWarning
                                />
                            </InputWrapper>
                        </VStack>
                    </Box>
                    <Box marginTop="large">
                        {isTipToastVisible && (
                            <TipToast
                                title="TIP"
                                description="Tip toast"
                                onClose={() => {
                                    setIsTipToastVisible(false);
                                    demoInputRef?.current?.focus();
                                }}
                            />
                        )}
                    </Box>
                    <Box marginVertical="medium">
                        <VStack style={applyStyle(inputStackStyle)} spacing="small">
                            <InputWrapper hint="This input is not valid.">
                                <Input
                                    value={input2Text}
                                    onChange={setInput2Text}
                                    label="To"
                                    hasError
                                />
                            </InputWrapper>
                        </VStack>
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
                        <Hint>Hned to mažem</Hint>
                        <Hint variant="error">Please enter a valid address dumbo</Hint>
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
                            console.warn('Press num pad button. No implementation yet.', value)
                        }
                    />
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
                    <TransactionItem
                        cryptoCurrencySymbol="BTC"
                        amountInCrypto={0.07812302}
                        amountInFiat={23250}
                        transactionStatus="received"
                    />
                    <TransactionItem
                        cryptoCurrencySymbol="ETH"
                        amountInCrypto={123}
                        amountInFiat={23250}
                        transactionStatus="sent"
                    />
                </Box>
            </Box>
        </Screen>
    );
};
