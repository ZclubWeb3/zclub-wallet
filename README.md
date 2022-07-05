# zclub wallet

This project is used for mobile hybrid solana wallet development, providing functions such as account creation, account import, transfer, swap, etc.

## API

- callMobileMethod
  > JavaScript Bridge, Requires android or ISO implementation。
- createdMnemonic
  > Generate 12 mnemonic words

  ```js
    let res = createdMnemonic();
    console.log(res);
    /*
    {
        coin: "SOL",
        mnemonics: "clock moon wife excuse armed half quiz curious proud rubber cave glow"
    }
    */
  ```

- getMnemonicWordList
  > return mnemonic word list

  ```js
    let list = getMnemonicWordList();
    console.log(list);
    /*
    {
      mnemonics_word_list:[
        'abandon',
        ...
      ]
    }
    */
  ```

- createdAccount
  > Generate account by mnemonic

  ```js
    let {mnemonics} = createdMnemonic();
    let account = createdAccount(mnemonics);
    console.log(account);
    /*
    {
        address: "8PwgbEKKfouzXTSXMS31eYz1tZtGobCgbdJrjUVDt4KQ",
        coin: "SOL",
        private_key: "5nRffY3bEiLcR4KhcUQ5N5oHY16kNLbPpiRNZXr1BdqaxU2b8Fpuw3ZUMRMgHjKnn15q8HHwwsdSxJf7kXJtgJUe"
    }
    */
  ```

- importAccount
  > Import account by private key

  ```js
    let payer = solanaWeb3.Keypair.generate();
    const privateKey = bs58.encode(payer.secretKey);
    let { address , private_key } = importAccount(privateKey);
    console.log(address === payer.publicKey.toBase58())
  ```

- initWallet
  > Initialize wallet with private key and connect solana network

  ```js
    let payer = solanaWeb3.Keypair.generate();
    const privateKey = bs58.encode(payer.secretKey);
    initWallet(privateKey);
    console.log(owner === payer);
    console.log(connection);
  ```

- sign
  > sign data

  ```js
    let payer = solanaWeb3.Keypair.generate();
    const privateKey = bs58.encode(payer.secretKey);
    const address = payer.publicKey.toBase58();
    const rawTransaction = await sign(privateKey,address,data);
  ```

- transfer
  > Submits a signed transaction to the cluster for processing.

  - params:
    - type: 'SOL'|'AUT'|'AHT'|'XNFT'
    - amount supply for 'SOL'|'AUT'|'AHT'
    - toAddress transfer to address
    - nftId optional when type is 'XNFT' need this
    - dir direction 'in'|'out'  'in' return Signature data, 'out' return transaction

  ```js
    let payer = solanaWeb3.Keypair.generate();
    const privateKey = bs58.encode(payer.secretKey);
    initWallet(privateKey);
    const res = await transfer(JSON.stringify{toAddress:"5rPGcn5dNGJ88oSxdkNWwwe8TR3pmUQkfWCrnAXUGRRs",type:'SOL',amount:0.1})
    console.log(res)
    /*
    { 
        transaction: "2BndzajSdrUtVHo1rUM9FHMBhXKuQzezJtrWindUVHUbBD81ehFw9wLf1LnxSQ7MQio6H5jnGVGkn2wHrMcEW5tt" 
    }
    */
    const res = await transfer(JSON.stringify({toAddress:"5rPGcn5dNGJ88oSxdkNWwwe8TR3pmUQkfWCrnAXUGRRs",type:'SOL',amount:0.1,dir:'in')})
    console.log(res)
    /*
    { 
        encodedTx: "2BndzajSdrUtVHo1rUM9FHMBhXKuQzezJtrWindUVHUbBD81ehFw9wLf1LnxSQ7MQio6H5jnGVGkn2wHrMcEW5tt" 
    }
    */
  ```

- createdInstruction
  > create solana TransactionInstructions structure

  ```js
    const data = {
        toAddress:"5rPGcn5dNGJ88oSxdkNWwwe8TR3pmUQkfWCrnAXUGRRs",
        type:'0',
        amount:0.1
    }
    let ins = createdInstruction(data);
  ```

- getTokenBalance
  > Get all token information of the current user

  ```js
    let info = await getTokenBalance();
  ```

- getSolBalance
  > Get sol amount of the current user

  ```js
    let amount = await getSolBalance();
  ```

- swap
  > We use orca to implement the solana token exchange

- getFee
  > orca fee

- getPrice
  > orca exchange price

- getCoinList
  > get owner all token info

  ```js
    const info = await getCoinList();
    console.log(info)
    /*
      {
        "coins": [
          {
            "name": "SOL",
            "asset": 0.123,
            "token_address": "xxxx",
            "icon": "",
            "fee": 0.0000005
          },
        ],
        "nft": [
          {
            "name": "AUT",
            "asset": 0.123,
            "token_address": "xxxx",
            "icon": "",
            "fee": 0.0000005
          }
        ]
      }
    */
  ```

- getBalance
  > get owner query token info

  - params:
    - name  token_address
    - token_address token address
  
  ```js
    const info = await getBalance('SOL');
    console.log(info);
    /*
      {
          "name": "SOL",
          "asset": 0.123,
          "token_address": "xxxx",
          "icon": "",
          "fee": 0.0000005
        }
    */
  ```

- signTransferToSpending
  > signature transfer with wallet to spending address

  - params:
    - assetName 'SOL'|'AUT'|'AHT'|'XNFT'
    - token_address assetName token address
    - amount

  ```js
    let sign = await signTransferToSpending('SOL','',1);
    console.log(sign);
    /*
      {
        name: 'SOL',
        token_address: '00001',
        transaction_sign: '2BndzajSdrUtVHo1rUM9FHMBhXKuQzezJtrWindUVHUbBD81ehFw9wLf1LnxSQ7MQio6H5jnGVGkn2wHrMcEW5tt',
      }
    */
  ```

- transferToCoin
  > transfer token to address

  - params:
    - coinName token name like 'SOL'|'AUT'|'AHT'|'xNFT'
    - token_address token address
    - wallet_address wallet address which transfer to
    - amount number of token to transfer
  
  ```js
    let res = await transferToCoin('SOL','','8PwgbEKKfouzXTSXMS31eYz1tZtGobCgbdJrjUVDt4KQ',1);
  ```
  