# wallet

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

  ```js
    let payer = solanaWeb3.Keypair.generate();
    const privateKey = bs58.encode(payer.secretKey);
    initWallet(privateKey);
    const res = await transfer({toAddress:"5rPGcn5dNGJ88oSxdkNWwwe8TR3pmUQkfWCrnAXUGRRs",type:'0',amount:0.1})
    console.log(res)
    /*
    { 
        transaction: "2BndzajSdrUtVHo1rUM9FHMBhXKuQzezJtrWindUVHUbBD81ehFw9wLf1LnxSQ7MQio6H5jnGVGkn2wHrMcEW5tt" 
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

- swap
  > We use orca to implement the solana token exchange

- getFee
  > orca fee
- getPrice
  > orca exchange price
  