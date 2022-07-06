import bs58 from "bs58";
import * as bip39 from "bip39";
import nacl from "tweetnacl";
import * as ed25519 from "ed25519-hd-key";
import * as solanaWeb3 from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import Decimal from "decimal.js";
import { SOL, NFT, SPL } from "@zclubweb3/zclub-solana";
import { getOrca, Network, OrcaPoolConfig, Percentage } from "@orca-so/sdk";
import * as Orca from "@orca-so/sdk";
import type { Cluster } from "@solana/web3.js";

interface ItransferData {
  type: string; // SOL|AHT|AUT|XNFT
  toAddress: string;
  amount?: string | number | bigint;
  tokenId?: string;
  dir?: string; // in,out default out
}

const CENTRALIZED_WALLET_ADDRESS =
  "ZCLUB6ueX9iALVEeNPVWQyrgTqvWAHcxozJP2ea2YcC";
const SOL_ADDRESS = "So11111111111111111111111111111111111111112"; // dev

const TOKEN_1 = "AUT";
const TOKEN_2 = "AHT";

const TOKENINFO = {
  [`${TOKEN_1}`]: "AUTeiKm7s4p1qYcxsXaSk6wExJUN7VuNhnoU7eUwgK2H",
  [`${TOKEN_2}`]: "AHTYibuZowvxXc5yCzLtjAsAdBzwWemvT1WLjLnpiG1v",
  USDC: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
};

const EXCHANGE_INFO = {
  SOL_USDC: {
    type: 0,
    dir: "left",
  },
  USDC_SOL: {
    type: 0,
    dir: "right",
  },
  [`${TOKEN_1}_USDC`]: {
    type: 1,
    dir: "left",
  },
  [`USDC_${TOKEN_1}`]: {
    type: 1,
    dir: "right",
  },
  [`${TOKEN_2}_USDC`]: {
    type: 2,
    dir: "left",
  },
  [`USDC_${TOKEN_2}`]: {
    type: 2,
    dir: "right",
  },
  [`${TOKEN_1}_SOL`]: {
    type: 3,
    dir: "left",
  },
  [`SOL_${TOKEN_1}`]: {
    type: 3,
    dir: "right",
  },
  [`${TOKEN_2}_SOL`]: {
    type: 4,
    dir: "left",
  },
  [`SOL_${TOKEN_2}`]: {
    type: 4,
    dir: "right",
  },
  [`${TOKEN_1}_${TOKEN_2}`]: {
    type: 5,
    dir: "left",
  },
  [`${TOKEN_2}_${TOKEN_1}`]: {
    type: 5,
    dir: "right",
  },
};

const poolInfo = {
  SOL_USDC: "APDFRM3HMr8CAGXwKHiu2f5ePSpaiEJhaURwhsRrUUt9",
  [`${TOKEN_1}_USDC`]: "token1_usdc",
  [`${TOKEN_2}_USDC`]: "token2_usdc",
};

let NETWORK = Network.MAINNET;
let CONNECT_NETWORK = "https://api.mainnet-beta.solana.com";
const isDEV = true;
if (isDEV) {
  NETWORK = Network.DEVNET;
  CONNECT_NETWORK = "https://api.devnet.solana.com";
  //CONNECT_NETWORK = "https://api.testnet.solana.com";
}

export const web3 = solanaWeb3;

const callMobileMethod = window.callMobileMethod;

// Here we take the first address directly, the network_path_code of solana is 501
// For example, the derived address we take here uses "m/44'/501'/0'/0'", you can also use other derived paths
// phantom default is “m/44'/501'/0'/0'”
const derivePath = "m/44'/501'/0'/0'";
//const derivePath = "m/44'/501'/0'";
/*
    generate mnemonic
    bip39.generateMnemonic
    byte    number of mnemonic words
    128 -> 12
    160 -> 15
    192 -> 18
    224 -> 21
    256 -> 24
*/
/**
 * @desc Create 12 mnemonic phrases
 */
export function createdMnemonic() {
  let mnemonic = bip39.generateMnemonic(
    128,
    undefined,
    bip39.wordlists.english
  );
  console.log("mnemonic", mnemonic);
  let json_data = {
    mnemonics: mnemonic,
    coin: "SOL",
  };
  callMobileMethod("onCreateMnemonics", json_data);
  return json_data;
}

/**
 * @desc get mnemonic worldlist
 */
function getMnemonicWordList() {
  let json_data = {
    mnemonics_word_list: bip39.wordlists.english,
  };
  callMobileMethod("onGetMnemonicWordList", json_data);
  return json_data;
}

/**
 * @desc Create wallet user by mnemonic
 *
 * @param mnemonic mnemonic string
 */
export function createdAccount(mnemonic: string) {
  // First get the seed according to the mnemonic
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const derivedSeed = ed25519.derivePath(derivePath, seed.toString("hex")).key;

  // get private key and address
  const privateKey = bs58.encode(
    nacl.sign.keyPair.fromSeed(derivedSeed).secretKey
  );
  const address = bs58.encode(
    nacl.sign.keyPair.fromSeed(derivedSeed).publicKey
  );
  let json_data = {
    address: address,
    coin: "SOL",
    private_key: privateKey,
  };
  callMobileMethod("onCreateAccount", json_data);
  return json_data;
}

/**
 * @desc Create account from key   There will be no mnemonic when importing an account through a private_key
 * @param privateKey   string after base58
 */
export function importAccount(privateKey: string) {
  const privateBuffer = bs58.decode(privateKey);
  const account = new web3.Account(privateBuffer);

  let json_data = {
    address: account.publicKey.toBase58(),
    coin: "SOL",
    private_key: privateKey,
  };
  callMobileMethod("onImportAccount", json_data);
  return json_data;
}

/**
 * @desc Connect to blockchain network & initialize wallet
 * @param privateKey string
 * @param urls url solana main network，test network，dev network
 * main https://api.mainnet-beta.solana.com/
 * test https://api.testnet.solana.com/
 * dev https://api.devnet.solana.com
 *
 * @return owner wallet account
 * */
let connection = new web3.Connection(CONNECT_NETWORK, "confirmed");
let owner;
export async function initWallet(privateKey: string, urls: string) {
  if (urls) {
    connection = new web3.Connection(urls, "confirmed");
  }
  const secretKey = bs58.decode(privateKey);
  owner = web3.Keypair.fromSecretKey(secretKey);
  // get all token account and sub account change event;
  window.owner = owner;

  let _res = await connection.getTokenAccountsByOwner(
    owner.publicKey, // owner here
    {
      programId: splToken.TOKEN_PROGRAM_ID,
    }
  );
  connection.onAccountChange(owner.publicKey, async (...args) => {
    const info = await _getCoinList();
    callMobileMethod("onWalletAssetChanged", info);
  });

  _res.value.map((item) => {
    connection.onAccountChange(item.pubkey, async (...args) => {
      const info = await _getCoinList();
      callMobileMethod("onWalletAssetChanged", info);
    });
  });

  // connection.onLogs(owner.publicKey,(...args)=>{
  //   console.log('logs change',args);
  //   callMobileMethod('onOwnerInfoChange',{});
  // })
  console.log("initWallet success", owner);
  callMobileMethod("onInitWallet", {});
}

/**
 * @desc signature
 *
 * @param privateKey
 * @param address wallet account address
 * @param data Data that needs to be signed
 **/
async function sign(privateKey: string, address: string, data) {
  const secretKey = bs58.decode(privateKey);
  const publicKey = new web3.PublicKey(address);
  let recentBlockhash = await connection.getRecentBlockhash();
  let transaction = new web3.Transaction({
    recentBlockhash: recentBlockhash.blockhash,
    feePayer: publicKey,
  });
  transaction.add(data);
  let transactionBuffer = transaction.serializeMessage();
  let signature = nacl.sign.detached(transactionBuffer, secretKey);
  transaction.addSignature(publicKey, signature as Buffer);
  let rawTransaction = transaction.serialize();
  let json_data = {
    rawTransaction: rawTransaction,
  };
  callMobileMethod("onSign", json_data);
  return rawTransaction;
}

/**
 * @desc transfer
 * @return
 * success { transaction: "2BndzajSdrUtVHo1rUM9FHMBhXKuQzezJtrWindUVHUbBD81ehFw9wLf1LnxSQ7MQio6H5jnGVGkn2wHrMcEW5tt" }
 * */
export async function transfer(data: ItransferData) {
  try {
    let res = await handleMultTransfer(data);

    let json_data;
    if (data.dir == "in") {
      json_data = {
        name: data.type,
        token_address: data.toAddress,
        transaction_sign: window.btoa(res),
      };
    } else {
      json_data = {
        transaction: res,
      };
    }
    return json_data;
  } catch (e: any) {
    let json_data = {
      error: e.message,
    };
    return json_data;
  }
}

/**
 * @desc Process different types of transactions
 * @param data
 * @returns
 */
async function handleMultTransfer(data: ItransferData) {
  console.log("transfer data", data);
  let res;
  switch (data.type) {
    case "SOL":
      // sol forward to an address
      /*
                {
                  type:'0' //fixed
                  toAddress: '' //to wallet address
                  amount: 100 // number 
                }
            */
      res = await solTransfer(data);
      return res;
    case "XNFT":
      // nft to an address
      /*
                {
                    type:'1',
                    toAddress: '',// to wallet address
                    tokenId: '', // ntf address
                    amount: 100 // number
                }
            */
      res = await nftTransfer(data);
      return res;
    case "AUT":
    case "AHT":
      // spl token to an address
      /*
                {
                    type:'2',
                    toAddress: '',// to wallet address
                    tokenId: '', // token address
                    amount: 100 // number
                }
            */
      res = await splTransfer(data);
      return res;
    default:
      throw new Error("not match transfer type");
  }
}

/**
 *
 * @desc  sol transfer
 * for transfer
 * **/
async function solTransfer(data: ItransferData) {
  const encodedTx = await SOL.transfer(
    connection,
    owner,
    owner,
    new web3.PublicKey(data.toAddress),
    new Decimal(data.amount as string).mul(web3.LAMPORTS_PER_SOL).toNumber()
  );
  if (data.dir == "in") {
    return encodedTx.encodedSignature;
  }
  const signature = await connection.sendEncodedTransaction(encodedTx.encodedSignature);
  const res = await connection.confirmTransaction(signature);
  if (!res.value.err) {
    return signature;
  } else {
    throw new Error(res.value.err as string);
  }
}

async function nftTransfer(data: ItransferData) {
  const encodedTx = await NFT.transfer(
    connection,
    owner,
    owner,
    new web3.PublicKey(data.tokenId as string),
    new web3.PublicKey(data.toAddress)
  );
  if (data.dir == "in") {
    return encodedTx.encodedSignature;
  }
  const signature = await connection.sendEncodedTransaction(encodedTx.encodedSignature);
  const res = await connection.confirmTransaction(signature);
  if (!res.value.err) {
    return signature;
  } else {
    throw new Error(res.value.err as string);
  }
}

async function splTransfer(data: ItransferData) {
  const encodedTx = await SPL.transfer(
    connection,
    owner,
    owner,
    new web3.PublicKey(TOKENINFO[data.type] || data.tokenId || ""),
    new web3.PublicKey(data.toAddress),
    BigInt(
      new Decimal(data.amount as string).mul(web3.LAMPORTS_PER_SOL).toNumber()
    )
  );
  if (data.dir == "in") {
    return encodedTx.encodedSignature;
  }
  const signature = await connection.sendEncodedTransaction(encodedTx.encodedSignature);
  const res = await connection.confirmTransaction(signature);
  if (!res.value.err) {
    return signature;
  } else {
    throw new Error(res.value.err as string);
  }
}

/**
 * type
 * sol_usdc 0
 * lua_usdc 1
 * lub_usdc 2
 * sol_lua 3
 * sol_lub 4
 * lua_lub 5
 *
 * 0,1,2 direct swap
 * 3,4,5 need to use usdc to transfer
 * */
/**
 * @desc swap https://www.orca.so/
 *  token->usdc Tokens are directly traded with usdc
 *  token->token is exchange through usdc
 *
 * @param type  0 sol_usdc 1 lua_usdc 2 lub_usdc 3 sol_lua 4 sol_lub 5 lua_lub
 * @param dir direction left right L->R R->L
 * @param money
 * @param slippage Acceptable slippage price 0.1 0.5(default) 1，custom
 *  more than 5 will prompt(your transaction may be frontrun) Less than 0.1 will prompt(your transaction may fail)
 * */
export async function swap(type, dir = "left", money, slippage) {
  if (!owner) {
    console.log("not owner");
    return {
      error: new Error("not owner"),
    };
  }
  const orca = getOrca(connection, NETWORK);
  let orcaSolPool;
  let orcaSolPool2;
  if (Number(type) == 0) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
  } else if (Number(type) == 1) {
    orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
  } else if (Number(type) == 2) {
    orcaSolPool = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  } else if (Number(type) == 3) {
    if (dir == "left") {
      orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
      orcaSolPool2 = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
    } else {
      orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
      orcaSolPool2 = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
    }
  } else if (Number(type) == 4) {
    if (dir == "left") {
      orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
      orcaSolPool2 = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
    } else {
      orcaSolPool = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
      orcaSolPool2 = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
    }
  } else if (Number(type) == 5) {
    if (dir == "left") {
      orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
      orcaSolPool2 = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
    } else {
      orcaSolPool = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
      orcaSolPool2 = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
    }
  }
  let solToken;
  if (orcaSolPool2) {
    if (dir == "left") {
      solToken =
        dir === "left" ? orcaSolPool2.getTokenA() : orcaSolPool2.getTokenB();
    } else {
      solToken =
        dir === "left" ? orcaSolPool2.getTokenB() : orcaSolPool2.getTokenA();
    }
  } else {
    solToken =
      dir === "left" ? orcaSolPool.getTokenB() : orcaSolPool.getTokenA();
  }
  const amount = new Decimal(money);
  try {
    let quote;
    let swapTxId;
    if (orcaSolPool2) {
      if (dir === "left") {
        quote = await orcaSolPool2.getQuote(solToken, amount, slippage);
      } else {
        quote = await orcaSolPool2.getQuote(solToken, amount, slippage);
      }
    } else {
      quote = await orcaSolPool.getQuote(solToken, amount, slippage);
    }
    const orcaAmount = quote.getMinOutputAmount();
    if (orcaSolPool2) {
      // gst => sol
      if (dir === "left") {
        const swapPayload2 = await orcaSolPool2.swap(
          owner,
          solToken,
          amount,
          orcaAmount
        );
        const solToken2 =
          dir === "left" ? orcaSolPool.getTokenB() : orcaSolPool.getTokenA();
        console.log(orcaAmount.toNumber());
        const amount2 = new Decimal(orcaAmount.toNumber());
        const quote2 = await orcaSolPool.getQuote(solToken2, amount2, slippage);

        const orcaAmount2 = quote2.getMinOutputAmount();
        console.log(orcaAmount2.toNumber());
        const swapPayload = await orcaSolPool.swap(
          owner,
          solToken2,
          amount2,
          orcaAmount2
        );
        if (dir === "left") {
          swapPayload2.transaction.add(swapPayload.transaction);
          swapPayload2.signers.push(...swapPayload.signers);
          swapTxId = await swapPayload2.execute();
          console.log({ swap: swapTxId });
        } else {
          swapPayload.transaction.add(swapPayload2.transaction);
          swapPayload.signers.push(...swapPayload2.signers);
          swapTxId = await swapPayload.execute();
          console.log({ swap: swapTxId });
        }
      } else {
        const swapPayload = await orcaSolPool2.swap(
          owner,
          solToken,
          amount,
          orcaAmount
        );
        const solToken2 =
          dir === "left" ? orcaSolPool.getTokenA() : orcaSolPool.getTokenB();
        const amount2 = new Decimal(orcaAmount.toNumber());
        const quote2 = await orcaSolPool.getQuote(solToken2, amount2, slippage);

        const orcaAmount2 = quote2.getMinOutputAmount();
        const swapPayload2 = await orcaSolPool.swap(
          owner,
          solToken2,
          amount2,
          orcaAmount2
        );
        console.log(dir, orcaAmount2.toNumber());
        if (dir === "left") {
          swapPayload2.transaction.add(swapPayload.transaction);
          swapPayload2.signers.push(...swapPayload.signers);
          swapTxId = await swapPayload2.execute();
          console.log({ swap: swapTxId });
        } else {
          swapPayload.transaction.add(swapPayload2.transaction);
          swapPayload.signers.push(...swapPayload2.signers);
          swapTxId = await swapPayload.execute();
          console.log({ swap: swapTxId });
        }
      }
    } else {
      console.log(amount.toNumber(), orcaAmount.toNumber(), solToken.name);
      const swapPayload = await orcaSolPool.swap(
        owner,
        solToken,
        amount,
        orcaAmount
      );
      swapTxId = await swapPayload.execute();
      console.log({ swap: swapTxId });
    }
    return {
      swap: swapTxId,
    };
  } catch (e) {
    return {
      error: e,
    };
  }
}

/**
 * Check the required fee
 * @param type same with swap type
 * */
export async function getFee(type) {
  const orca = getOrca(connection, NETWORK);
  let orcaSolPool;
  let orcaSolPool2;
  if (Number(type) == 0) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
  } else if (Number(type) == 1) {
    orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
  } else if (Number(type) == 2) {
    orcaSolPool = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  } else if (Number(type) == 3) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
    orcaSolPool2 = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
  } else if (Number(type) == 4) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
    orcaSolPool2 = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  } else if (Number(type) == 5) {
    orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
    orcaSolPool2 = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  }
  if (!orcaSolPool2) {
    const solToken = orcaSolPool.getTokenA();
    const amount = new Decimal(1);
    const quote = await orcaSolPool.getQuote(solToken, amount);
    const s1 = await quote.getLPFees();
    console.log({ fee: s1.toNumber().toString() });
  } else {
    const solToken = orcaSolPool.getTokenA();
    const amount = new Decimal(1);
    const quote = await orcaSolPool.getQuote(solToken, amount);
    const s1 = await quote.getLPFees();
    const solToken2 = orcaSolPool2.getTokenA();
    const amount2 = new Decimal(1);
    const quote2 = await orcaSolPool2.getQuote(solToken2, amount2);
    const s2 = await quote2.getLPFees();
    const num = s1.toNumber() + s2.toNumber();
    console.log({ fee: num.toString() });
  }
}

/** @type
 * @getPrice
 * Query 1 exchange price
 */

export async function getPrice(type: number | string, money = 1, dir = "left") {
  const orca = getOrca(connection, NETWORK);
  //const orca = getOrca(connection, Network.MAINNET);
  let orcaSolPool;
  let orcaSolPool2;
  if (Number(type) == 0) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
  } else if (Number(type) == 1) {
    orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
  } else if (Number(type) == 2) {
    orcaSolPool = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  } else if (Number(type) == 3) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
    orcaSolPool2 = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
  } else if (Number(type) == 4) {
    orcaSolPool = orca.getPool(poolInfo.SOL_USDC as OrcaPoolConfig);
    orcaSolPool2 = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  } else if (Number(type) == 5) {
    orcaSolPool = orca.getPool(poolInfo.LUA_USDC as OrcaPoolConfig);
    orcaSolPool2 = orca.getPool(poolInfo.LUB_USDC as OrcaPoolConfig);
  }
  if (!orcaSolPool2) {
    const solTokenB = orcaSolPool.getTokenB();
    const solTokenA = orcaSolPool.getTokenA();
    const amount = new Decimal(money);
    const quote = await orcaSolPool.getQuote(solTokenB, amount);
    const quotea = await orcaSolPool.getQuote(solTokenA, amount);
    const rate = await quote.getRate();
    const rate1 = await quotea.getRate();
    console.log({
      tokenA: rate1.toNumber().toString(),
      tokenB: rate.toNumber().toString(),
      type,
      getPrice: "getPrice",
    });
    return {
      tokenA: rate1.toNumber().toString(),
      tokenB: rate.toNumber().toString(),
      type,
      getPrice: "getPrice",
    };
  } else {
    const solTokenA = orcaSolPool.getTokenA();
    const solTokenB = orcaSolPool.getTokenB();
    const amountA = new Decimal(money);
    const quoteA = await orcaSolPool.getQuote(solTokenA, amountA);

    const solToken2A = orcaSolPool2.getTokenA();
    const solToken2B = orcaSolPool2.getTokenB();
    const amount3 = new Decimal(money);

    const quote2A = await orcaSolPool2.getQuote(solToken2A, amount3);
    const quote2B = await orcaSolPool2.getQuote(solToken2B, amount3);
    const quoteB = await orcaSolPool.getQuote(solTokenB, amountA);
    const rate = await quoteA.getRate();

    const rateB = await quoteB.getRate();

    const rate2 = await quote2A.getRate();
    const rate2B = await quote2B.getRate();
    console.log({
      tokenB: rate2B.mul(rate).toNumber().toString(),
      tokenA: rate2.mul(rateB).toNumber().toString(),
      type,
      getPrice: "getPrice",
    });
    return {
      tokenB: rate2B.mul(rate).toNumber().toString(),
      tokenA: rate2.mul(rateB).toNumber().toString(),
      type,
      getPrice: "getPrice",
    };
  }
}

/***
 * @getAllToken
 *
 * @param address account address
 * @description get all token
 */
export async function getAllToken(address: string) {
  const { AccountLayout, TOKEN_PROGRAM_ID } = splToken;
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    new web3.PublicKey(address),
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );
  const tokenInfo = {};
  tokenAccounts.value.forEach((e) => {
    const accountInfo = AccountLayout.decode(e.account.data);
    tokenInfo[new web3.PublicKey(accountInfo.mint).toBase58()] =
      accountInfo.amount;
  });
  return tokenInfo;
}

/***
 * @getTokenBalance
 *
 * @description Get all token information of the current user
 */
export async function getTokenBalance() {
  const allInfo = await SPL.getAllTokenBalance(connection, owner.publicKey);
  const json_data = allInfo;
  callMobileMethod("onGetTokenBalance", json_data);
  return allInfo;
}

/***
 * @getTokenBalance
 *
 * @description Get sol amount of the current user
 */
export async function getSolBalance() {
  const balance = await SOL.getBalance(connection, owner.publicKey);
  const json_data = {
    SOL: new Decimal(balance.toString()).div(web3.LAMPORTS_PER_SOL).toNumber(),
  };
  callMobileMethod("onGetSolBalance", json_data);
  return balance;
}

function _getCoinVal(str: string) {
  return new Decimal(str).div(web3.LAMPORTS_PER_SOL).toString();
}

/***
 * @_getCoinList
 *
 * @description get owner all assets list
 */
async function _getCoinList() {
  const sol_balance = await SOL.getBalance(connection, owner.publicKey);
  const spl_balance = await SPL.getAllTokenBalance(connection, owner.publicKey);
  const json_data = {
    coins: [
      {
        name: "SOL",
        asset: _getCoinVal(sol_balance.toString()),
        token_address: "xxxx",
        icon: "",
        fee: "0.0000005",
      },
      {
        name: TOKEN_1,
        asset: _getCoinVal((spl_balance[TOKENINFO[TOKEN_1]] || 0).toString()),
        token_address: TOKENINFO[TOKEN_1],
        icon: "",
        fee: "0.0000005",
      },
      {
        name: TOKEN_2,
        asset: _getCoinVal((spl_balance[TOKENINFO[TOKEN_2]] || 0).toString()),
        token_address: TOKENINFO[TOKEN_2],
        icon: "",
        fee: "0.0000005",
      },
      {
        name: "USDC",
        asset: _getCoinVal((spl_balance[TOKENINFO["USDC"]] || 0).toString()),
        token_address: TOKENINFO["USDC"],
        icon: "",
        fee: "0.0000005",
      },
    ],
    nft: [],
  };
  return json_data;
}
export async function getCoinList() {
  try {
    const res = await _getCoinList();
    callMobileMethod("onGetCoinList", res);
  } catch (e) {
    callMobileMethod("onGetCoinListFailed", {
      error: e,
    });
  }
}
/**
 * @getBalance
 *
 * @param name // 'SOL'|'AUT'|'AHT'
 * @param token_address // token id
 */
export async function getBalance(name: string, token_address: string) {
  let json_data;
  let res;
  switch (name) {
    case "SOL":
      res = await SOL.getBalance(connection, owner.publicKey);
      json_data = {
        name: "SOL",
        asset: new Decimal(res.toString())
          .div(web3.LAMPORTS_PER_SOL)
          .toString(),
        token_address: SOL_ADDRESS,
        icon: "",
      };
      callMobileMethod("onGetBalance", json_data);
      return json_data;
    case "AUT":
    case "AHT":
    case "USDC":
      res = await SPL.getAllTokenBalance(connection, owner.publicKey);
      json_data = {
        name: name,
        asset: new Decimal(res[token_address].toString())
          .div(web3.LAMPORTS_PER_SOL)
          .toString(),
        token_address: token_address,
        icon: "",
      };
      callMobileMethod("onGetBalance", json_data);
      return json_data;
    default:
      res = await SPL.getAllTokenBalance(connection, owner.publicKey);
      json_data = {
        name: "",
        asset: res[token_address],
        token_address: token_address,
        icon: "",
      };
      callMobileMethod("onGetBalance", json_data);
      return json_data;
  }
}

/***
 * @signTransferToSpending
 *
 * @param assetName token name like 'SOL'|'AUT'|'AHT'|'xNFT'
 * @param token_address wallet address which transfer to
 * @param amount number of token to transfer
 */
export async function signTransferToSpending(
  assetName: string,
  token_address: string,
  amount: number
) {
  const res = await transfer({
    type: assetName,
    toAddress: CENTRALIZED_WALLET_ADDRESS,
    tokenId: token_address,
    amount: amount,
    dir: "in",
  });
  fetch("https://api.devnet.solana.com/", {
    headers: {
      accept: "*/*",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      method: "sendTransaction",
      jsonrpc: "2.0",
      params: [
        window.atob(res.transaction_sign),
        { encoding: "base64", preflightCommitment: "confirmed" },
      ],
      id: "4567d9ac-31b5-414a-8bc5-7dfc2a8f1c7d",
    }),
    method: "POST",
  });
  if (res.error) {
    callMobileMethod("onSignTransferToSpendingFailed", res);
  } else {
    callMobileMethod("onSignTransferToSpending", res);
  }
}

/**
 * @transferToCoin
 *
 * @param coinName token name like 'SOL'|'AUT'|'AHT'|'xNFT'
 * @param token_address token address
 * @param wallet_address wallet address which transfer to
 * @param amount number of token to transfer
 */
export async function transferToCoin(
  coinName: string,
  token_address: string,
  wallet_address: string,
  amount: number
) {
  const res = await transfer({
    type: coinName,
    toAddress: wallet_address,
    amount: amount,
    tokenId: token_address,
    dir: "out",
  });
  if (res.error) {
    callMobileMethod("onTransferToCoinFailed", res);
  } else {
    callMobileMethod("onTransferToCoin", res);
  }
}

/**
 * @_getTradeTokenAccount
 */
export async function _getTradeTokenAccount(fromCoin: string, toCoin: string) {
  const { PublicKey } = web3;
  const { TOKEN_PROGRAM_ID } = splToken;
  // todo
  // return (await PublicKey.findProgramAddress(
  //   [
  //       owner.publicKey.toBuffer(),
  //       TOKEN_PROGRAM_ID.toBuffer(),
  //       tokenMintAddress.toBuffer(),
  //   ],
  //   SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
  // ))[0];
  return { address: "xxxxxxxxxxxxxxxx" };
}

export async function getTradeTokenAccount(fromCoin: string, toCoin: string) {
  const res = await _getTradeTokenAccount(fromCoin, toCoin);
  // @ts-ignore
  if (res.error) {
    callMobileMethod("onGetTradeTokenAccountFailed", res);
  } else {
    callMobileMethod("onGetTradeTokenAccount", res);
  }
}

export async function createTradeTokenAccount() {
  // todo
  const json_data = {
    address: "xxxxxxxxxxxxxxxx",
  };
  callMobileMethod("onCreateTradeTokenAccount", json_data);
}

export async function _calcTradeTokenAmount(
  fromCoin: string,
  toCoin: string,
  amount: number,
  tolerance: number
) {
  const swapType = `${fromCoin}-${toCoin}`;
  const { type, dir } = EXCHANGE_INFO[swapType];
  const res = await getPrice(type, amount, dir);
  const data_json = {
    fromCoin,
    toCoin,
    amount: new Decimal(amount)
      .div(dir == "left" ? res.tokenB : res.tokenA)
      .toString(),
  };
  return res;
}

export async function calcTradeTokenAmount(
  fromCoin: string,
  toCoin: string,
  amount: number,
  tolerance: number
) {
  const res = await _calcTradeTokenAmount(fromCoin, toCoin, amount, tolerance);
  // @ts-ignore
  if (res.error) {
    callMobileMethod("onCalcTradeTokenAmountFailed", res);
  } else {
    callMobileMethod("onCalcTradeTokenAmount", res);
  }
}

export async function _tradeToken(
  fromCoin: string,
  toCoin: string,
  amount: number,
  tolerance: number
) {
  const swapType = `${fromCoin}-${toCoin}`;
  const { type, dir } = EXCHANGE_INFO[swapType];
  const res = await swap(
    type,
    dir,
    amount,
    Percentage.fromFraction(tolerance, 100)
  );
  return res;
}

export async function tradeToken(
  fromCoin: string,
  toCoin: string,
  amount: number,
  tolerance: number
) {
  const res = await _tradeToken(fromCoin, toCoin, amount, tolerance);
  // @ts-ignore
  if (res.error) {
    callMobileMethod("onTradeTokenFailed", res);
  } else {
    callMobileMethod("onTradeToken", res);
  }
}

window.web3 = web3;
window.solanaWeb3 = web3;
window.bs58 = bs58;
window.splToken = splToken;
window.connection = connection;
window.Orca = Orca;
window.Decimal = Decimal;
window.createdMnemonic = createdMnemonic;
window.createdAccount = createdAccount;
window.importAccount = importAccount;
window.transfer = transfer;
window.initWallet = initWallet;
window.swap = swap;
window.getAllToken = getAllToken;
window.getTokenBalance = getTokenBalance;
window.getSolBalance = getSolBalance;
window.getMnemonicWordList = getMnemonicWordList;
window.getPrice = getPrice;
window.getCoinList = getCoinList;
window.getBalance = getBalance;
window.signTransferToSpending = signTransferToSpending;
window.transferToCoin = transferToCoin;
window.getTradeTokenAccount = getTradeTokenAccount;
window.createTradeTokenAccount = createTradeTokenAccount;
window.calcTradeTokenAmount = calcTradeTokenAmount;
window.tradeToken = tradeToken;
/**
 *
 * web3.PublicKe Convert address string to raw format
 * bs58.decode Convert key string to raw format
 */
