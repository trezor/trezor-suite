## Send form active elements description

### Outputs (BTC coins only):

-   regular (transfer) output is set by default
-   add OP_RETURN: if default output has any values then OP_RETURN is added as a second output otherwise will replace the first input
-   remove OP_RETURN: if there is only 1 output (OP_RETURN) then switch to regular otherwise just remove it
-   add recipient
-   remove recipient
-   Clear all

---

### Address:

-   on address input change
-   on QR scan
-   on Import (to be done)

### Address errors:

-   RECIPIENT_IS_NOT_SET (empty field)
-   RECIPIENT_IS_NOT_VALID (not valid address)
-   RECIPIENT_CANNOT_SEND_TO_MYSELF (XRP only: cannot send to myself)

---

### Amount:

-   on amount input change
-   on Fiat input change
-   on QR scan (optional if defined in QR code)
-   on Import (to be done, optional if defined in file)
-   IF sendmax is ON
-   IF sendmax is set AND has second(or multiple) output(s): on second output Amount change
-   IF sendmax is set: on every fee level change
-   IF sendmax is set: on custom fee change
-   IF sendmax is set: on BTC opreturn data changed
-   IF sendmax is set: on ETH data changed
-   (ETH only) IF sendmax is set AND switching between ETH (base currency) and TOKEN

### Amount errors:

-   AMOUNT_IS_NOT_SET (empty field)
-   AMOUNT_IS_TOO_LOW (lower/equal than zero + ETH exception: 0 amount is possible ONLY for tx with DATA)
-   AMOUNT_IS_BELOW_DUST lower than network dust limit
-   AMOUNT_IS_NOT_ENOUGH (not enough funds on account)
-   AMOUNT_NOT_ENOUGH_CURRENCY_FEE (ETH only: trying to send TOKEN without enough ETH to cover TX fee)
-   AMOUNT_IS_MORE_THAN_RESERVE (XRP only: trying to spend the reserve)
-   AMOUNT_IS_LESS_THAN_RESERVE (XRP only: trying to send less XRP than required reserve to the empty account)
-   AMOUNT_IS_NOT_IN_RANGE_DECIMALS (amount with invalid decimal places)
-   AMOUNT_IS_NOT_INTEGER (ERC20 only: token doesn't accept decimal places)

---

### Fiat:

-   on fiat input change
-   on Amount input change (any reason listed above)
-   on Currency select change (recalculation)
-   on Import (to be done, optional if defined in file AND amount is not defined in file)

### Fiat errors:

-   AMOUNT_IS_NOT_SET (empty field)
-   AMOUNT_IS_TOO_LOW (lower than 0, 0 is still possible if recalculated amount is lower than 1 cent)
-   AMOUNT_IS_NOT_IN_RANGE_DECIMALS (max. 2 decimals allowed)

---

### Fee:

-   on fee level click
-   on custom fee level input change
-   on BTC OP_RETURN data changed
-   on ETH data changed
-   switching from "regular" fee level to "custom" should set value from last selected fee
-   IF fee level wasn't changed yet (normal) and there is not enough coins to satisfy normal level should be automatically switched to first possible (lower) level, either LOW or CUSTOM...
-   last used fee level will be remembered globally for this coin
-   estimated time is only available for BTC-like coins

### Fee errors (custom level):

-   CUSTOM_FEE_IS_NOT_SET (empty field)
-   CUSTOM_FEE_IS_NOT_INTEGER (BTC and XRP: decimals not allowed)
-   AMOUNT_IS_NOT_IN_RANGE_DECIMALS (ETH only: decimals are allowed but with max. 9 decimals - GWEI is not satoshi)
-   CUSTOM_FEE_NOT_IN_RANGE (must be between minFee and maxFee specified in coins.json, in @trezor/connect)

---

### (BTC only) OP_RETURN output:

-   HEX field, (on the right) should be changed on every ASCII field (on the left) change
-   ASCII field should be changed ONLY if HEX is valid, otherwise should be empty

### OP_RETURN output errors:

-   DATA_NOT_SET (empty fields)
-   DATA_NOT_VALID_HEX (not valid hexadecimal)
-   DATA_HEX_TOO_BIG (data size limited to 80 bytes)

---

### (BTC only) Locktime:

Additional field in send form, activated by "Add locktime" option.

If the number is greater than 500000000 then it is a timestamp otherwise is block number

-   on "add locktime" input change
-   on RBF option enable
-   should disable RBF option if set
-   should disable BROADCAST option if set

### Locktime errors:

-   LOCKTIME_IS_NOT_SET
-   LOCKTIME_IS_NOT_NUMBER
-   LOCKTIME_IS_TOO_LOW (lower/equal zero)
-   LOCKTIME_IS_NOT_INTEGER (decimals not allowed)
-   LOCKTIME_IS_TOO_BIG (locktime larger than max unix timestamp \* 2 = 4294967294)

---

### (BTC only) RBF:

Additional checkbox in send form, since this could be only true/false there is no validation for that filed

---

### (ETH only) Data:

Additional field in send form, activated by "Add data" option. Same behavior as BTC OP_RETURN output.

-   HEX field, (on the right) should be changed on every ASCII field (on the left) change
-   ASCII field should be changed ONLY if HEX is valid, otherwise should be empty

### Data errors:

-   DATA_NOT_VALID_HEX
-   DATA_HEX_TOO_BIG (data size limit: 8192 bytes for protobuf single message encoding)

---

### (XRP only) Destination tag:

Additional field in send form, activated by "Add destination tag" option
It doesn't have impact on transaction itself (fee, amount etc)

### Destination tag errors:

-   DESTINATION_TAG_NOT_SET
-   DESTINATION_TAG_IS_NOT_NUMBER
-   DESTINATION_TAG_IS_NOT_VALID (decimals not allowed, in range: 0 - 4294967295)

---

### Broadcast:

-   toggle "Sign transaction" / "Send transaction" button
-   "Review transaction" modal with different options at the last step (copy or download signed tx)

---

### Drafts:

-   draft should be saved on change of any field (if this field is valid)
-   draft should be loaded after changing url (going back to send form from any other page)

---

### Send RAW:

-   Broadcast signed tx to the network regardless of tx OWNER, this tx doesn't have to be signed by currently selected account, only selected NETWORK matters

---

### Precomposed transaction ("Total Sent" field)

-   on load draft
-   on address change
-   on amount change
-   on fee change
-   on additional option change

---

### Review modal

-   can be cancelled at any time during signing
-   mirroring data displayed on the device
-   if there is BTC OP_RETURN data or ETH DATA present and those data are larger than 10 chars additional "expand button" will appear next to it
-   (BTC only) Expandable "Transaction detail" section
-   Regarding to BROADCAST option "Send transaction" or "Copy/download transaction" buttons are available on the last step
