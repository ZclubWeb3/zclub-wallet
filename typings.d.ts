interface Window {
  bs58: Record<string, any>;
  bip39: Record<string, any>;
  nacl: Record<string, any>;
  ed25519: Record<string, any>;
  splToken: Record<string, any>;
  Decimal: Record<string, any>;
  orca: Record<string, any>;
  web3: Record<string, any>;
  solanaWeb3: Record<string, any>;
  connection: Record<string, any>;
  Orca: Record<string, any>;
  owner: any;
  callMobileMethod: (method: string, data: Record<string, any>) => {};
  createdMnemonic: () => {
    mnemonics: string;
    coin: string;
  };
  validateMnemonic:(mnemonic: string)=> void;
  createdAccount: (mnemonic: any) => {
    address: string;
    coin: string;
    private_key: string;
  } | undefined;
  importAccount: (privateKey: any) => {
    address: string;
    coin: string;
    private_key: any;
  };
  transfer: (transferJsonStr: any) => Promise<any>;
  initWallet: (privateKey: any, urls: any) => void;
  swap: (
    type: any,
    dir: string | undefined,
    money: any,
    slippage: number
  ) => Promise<any>;
  getAllToken: (address: string) => Promise<{}>;
  getTokenBalance: () => Promise<{}>;
  getSolBalance: () => Promise<{}>;
  getMnemonicWordList: () => Record<string, any>;
  getPrice: (type: number | string, money = 1, dir = "left") => Promise<any>;
  getCoinList: () => Promise<any>;
  getBalance: (name: string, token_address: string) => Promise<any>;
  signTransferToSpending: (assetName:string, token_address:string, amount:number) => Promise<any>;
  transferToCoin: (  coinName:string,token_address:string, wallet_address:string,amount:number) => Promise<any>;
  getTradeTokenAccount: (fromCoin: string, toCoin: string) => Promise<any>;
  createTradeTokenAccount: () => Promise<any>;
  calcTradeTokenAmount: (fromCoin:string,toCoin:string, amount:number,tolerance:number) => Promise<any>;
  tradeToken: (fromCoin:string, toCoin:string, amount:number, tolerance:number) => Promise<any>;
}
