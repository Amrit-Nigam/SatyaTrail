require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { ALCHEMY_API_KEY, ETHERSCAN_API_KEY, SEPOLIA_API_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  paths: {
    sources: "./contracts",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",  // Your local network
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
      }
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [`0x${SEPOLIA_API_KEY}`],
      chainId: 11155111,
    },
     bsc: {
      url: `https://bsc-testnet-dataseed.bnbchain.org`,
      accounts: [`0x${SEPOLIA_API_KEY}`],
      chainId: 97
    },
    hardhat: {
      // This is the default network when you run `npx hardhat test`
      // Remove gas limits to allow unlimited gas for testing
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 20,
        accountsBalance: "10000000000000000000000",
      }
    }
  }
};
