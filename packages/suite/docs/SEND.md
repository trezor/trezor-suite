NOT FINISHED

# Send

## Common

### Clear
- address: null
- amount: null
- settMaxActive false
- fiatValue: null
- localCurrency: user currency setting
- ethereumGasPrice: normal fee level - feePerUnit
- ethereumGasLimit:  normal fee level - feeLimit
- ethereumData: null
- rippleDestinationTag: null
- reset outputs count to 1

### Recipient Address

#### BTC
- scan QR
- validation `TR_ADDRESS_IS_NOT_SET | TR_ADDRESS_IS_NOT_VALID`

#### ETH
- scan QR
- validation `TR_ADDRESS_IS_NOT_SET | TR_ADDRESS_IS_NOT_VALID`

#### XRP
- scan QR
- validation `TR_ADDRESS_IS_NOT_SET | TR_ADDRESS_IS_NOT_VALID | TR_XRP_CANNOT_SEND_TO_MYSELF`
- check empty address state

### Amount

#### BTC
- validation `TR_AMOUNT_IS_NOT_SET | TR_AMOUNT_IS_NOT_NUMBER | TR_AMOUNT_IS_NOT_ENOUGH | TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS`
- compose transaction
- fiat input update
- change set max state for current input

#### ETH
- validation `TR_AMOUNT_IS_NOT_SET | TR_AMOUNT_IS_NOT_NUMBER | TR_AMOUNT_IS_NOT_ENOUGH | TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS`
- fiat input update
- compose transaction
- change set max state for current input

#### XRP
- validation `TR_AMOUNT_IS_NOT_SET | TR_AMOUNT_IS_NOT_NUMBER | TR_AMOUNT_IS_NOT_ENOUGH | TR_AMOUNT_IS_NOT_IN_RANGE_DECIMALS | TR_XRP_CANNOT_SEND_LESS_THAN_RESERVE`
- fiat input update
- compose transaction
- change set max state for current input

### Token select

#### BTC
- disabled

#### ETH
- select ERC-20 token

#### XRP
- disabled

### Fiat

- not visible with testnets (no fiat rates)

#### BTC

#### ETH

#### XRP

### Currency select

- not visible with testnets (no fiat rates)

#### BTC
- change currency for input
- recalculate fiat value

#### ETH
- change currency for input
- recalculate fiat value

#### XRP
- change currency for input
- recalculate fiat value

## Advanced form Bitcoin

### Add
- add 1 output (Recipient Address, Amount, Token Select, Currency select)

### Fee
- change selected fee level (Normal, Low, Hight, Custom)
- if custom option - show custom fee input and paste last selected fee value
- recalculate Amount if setMax is active

### Custom fee

- units are drops

### Locktime
- coming soon

### Replace by fee
- coming soon

## Advanced form Ethereum

#### Data
#### Gas price
#### Gas limit

## Advanced form Ripple

#### Fee
#### Custom fee
#### Destination tag
