const data = {
    "types": {
        "Permit": [
            {
                "name": "owner",
                "type": "address"
            },
            {
                "name": "spender",
                "type": "address"
            },
            {
                "name": "value",
                "type": "uint256"
            },
            {
                "name": "nonce",
                "type": "uint256"
            },
            {
                "name": "deadline",
                "type": "uint256"
            }
        ],
        "EIP712Domain": [
            {
                "name": "name",
                "type": "string"
            },
            {
                "name": "version",
                "type": "string"
            },
            {
                "name": "chainId",
                "type": "uint256"
            },
            {
                "name": "verifyingContract",
                "type": "address"
            }
        ]
    },
    "domain": {
        "name": "USD Coin",
        "version": "2",
        "chainId": "1",
        "verifyingContract": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
    },
    "primaryType": "Permit",
    "message": {
        "owner": "0x0000000000000000000000000000000000000000",
        "spender": "0xc92e8bdf79f0507f65a392b0ab4667716bfe0110",
        "value": "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        "nonce": "0",
        "deadline": "1931839775"
    }
}
const str = JSON.stringify(data);
const parsedData = JSON.parse(str);
console.log(typeof parsedData.message.value, parsedData.message.value);
