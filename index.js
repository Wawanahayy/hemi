import { http, createPublicClient, parseEther, encodeFunctionData } from "viem";
import { hemiPublicBitcoinKitActions, hemiPublicOpNodeActions, hemiSepolia } from "hemi-viem";
import { ethers } from 'ethers';
import logger from './logger.js'; // Mengimpor logger
import hemiABI from './abi.js';
import WETHABI from './WETH.js';
import UNIABI from './uniswap.js';
import { accounts } from './config.js'; // Mengimpor file konfigurasi
import readline from 'readline'; // Mengimpor readline untuk input interaktif

const provider = new ethers.JsonRpcProvider('https://testnet.rpc.hemi.network/rpc'); // Menambahkan provider

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Kelas EthereumClient, digunakan untuk berinteraksi dengan blockchain Ethereum
class EthereumClient {
  constructor(privateKey) {
    this.account = new ethers.Wallet(privateKey, provider); // Menghubungkan wallet ke provider

    this.publicClient = createPublicClient({
      transport: http('https://testnet.rpc.hemi.network/rpc'),
    });
  }

  // Menyetorkan ETH ke kontrak proxy
  async depositETH(minGasLimit, extraData, amount) {
    const proxyContractAddress = '0xc94b1BEe63A3e101FE5F71C80F912b4F4b055925';
    const sendEth = parseEther(amount.toString());

    // Memeriksa apakah saldo lebih besar dari jumlah deposit
    const balance = await this.publicClient.getBalance({
      address: this.account.address,
    });

    if (balance < sendEth) {
      logger.error(`Saldo tidak mencukupi, silakan deposit ETH lebih dulu, saldo saat ini: ${balance}`); // Menggunakan logger untuk mencatat kesalahan
      throw new Error('Saldo tidak valid'); // Membuang error untuk menghentikan operasi
    }

    // Mengkodekan data fungsi
    const data = encodeFunctionData({
      abi: hemiABI,
      functionName: 'depositETH',
      args: [minGasLimit, extraData],
    });

    try {
      // Mengirim transaksi menggunakan ethers.js
      const tx = await this.account.sendTransaction({
        to: proxyContractAddress,
        data,
        value: sendEth,
      });

      logger.info(`Transaksi terkirim: ${tx.hash}`); // Menggunakan logger untuk mencatat informasi transaksi
    } catch (error) {
      logger.error(`Terjadi kesalahan saat mengirim transaksi: ${error.message}`); // Menggunakan logger untuk mencatat kesalahan
      throw error; // Membuang error agar bisa ditangkap di luar
    }
  }
}

// Kelas HemiSepolia, digunakan untuk menangani operasi terkait Hemi Sepolia
class HemiSepolia {
  constructor(privateKey) {
    this.account = new ethers.Wallet(privateKey, provider); // Menghubungkan wallet ke provider

    this.publicClient = createPublicClient({
      chain: hemiSepolia,
      transport: http('https://testnet.rpc.hemi.network/rpc'),
    });
  }

  // Metode untuk menukar WETH
  async swapWeth(sendEthAmount) {
    const WethContractAddress = '0x0C8aFD1b58aa2A5bAd2414B861D8A7fF898eDC3A';
    const sendEth = parseEther(sendEthAmount.toString());

    // Memeriksa saldo
    const balance = await this.publicClient.getBalance({
      address: this.account.address,
    });

    if (balance < sendEth) {
      logger.error(`Saldo tidak mencukupi, silakan deposit ETH lebih dulu untuk menukar WETH`); // Menggunakan logger untuk mencatat kesalahan
      throw new Error('Saldo tidak mencukupi untuk penukaran WETH'); // Membuang error untuk menghentikan operasi
    }

    const data = encodeFunctionData({
      abi: WETHABI,
      functionName: 'deposit',
    });

    try {
      // Mengirim transaksi menggunakan ethers.js
      const tx = await this.account.sendTransaction({
        to: WethContractAddress,
        data,
        value: sendEth,
      });

      logger.info(`Transaksi WETH terkirim: ${tx.hash}`); // Menggunakan logger untuk mencatat informasi transaksi
    } catch (error) {
      logger.error(`Terjadi kesalahan saat menukar WETH: ${error.message}`); // Menggunakan logger untuk mencatat kesalahan
      throw error; // Membuang error agar bisa ditangkap di luar
    }
  }

  // Metode untuk menukar DAI
  async swapDai(sendEthAmount) {
    const UniswapContractAddress = '0xA18019E62f266C2E17e33398448e4105324e0d0F';
    const sendEth = parseEther(sendEthAmount.toString());

    const balance = await this.publicClient.getBalance({
      address: this.account.address,
    });

    if (balance < sendEth) {
      logger.error(`Saldo tidak mencukupi, silakan deposit ETH lebih dulu untuk menukar DAI`); // Menggunakan logger untuk mencatat kesalahan
      throw new Error('Saldo tidak mencukupi untuk penukaran DAI'); // Membuang error untuk menghentikan operasi
    }

    const data = encodeFunctionData({
      abi: UNIABI,
      functionName: 'execute',
      args: [
        '0x0b00',
        [
          "0x000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000005af3107a4000",
          "0x000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000005af3107a4000000000000000000000000000000000000000000000000000457fd60a0614bb5400000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002b0c8afd1b58aa2a5bad2414b861d8a7ff898edc3a000bb8ec46e0efb2ea8152da0327a5eb3ff9a43956f13e000000000000000000000000000000000000000000"
        ],
        // Kedaluwarsa dalam 20 menit
        Math.floor(Date.now() / 1000) + 60 * 20 + ''
      ]
    });

    try {
      // Mengirim transaksi menggunakan ethers.js
      const tx = await this.account.sendTransaction({
        to: UniswapContractAddress,
        data,
        value: sendEth,
      });

      logger.info(`Transaksi DAI terkirim: ${tx.hash}`); // Menggunakan logger untuk mencatat informasi transaksi
    } catch (error) {
      logger.error(`Terjadi kesalahan saat menukar DAI: ${error.message}`); // Menggunakan logger untuk mencatat kesalahan
      throw error; // Membuang error agar bisa ditangkap di luar
    }
  }
}

// Fungsi untuk meminta input dari pengguna
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
};

// Contoh penggunaan
(async () => {
  for (const account of accounts) {
    const { privateKey } = account;

    // Memeriksa format private key, tambahkan '0x' jika tidak dimulai dengan '0x'
    let formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;

    try {
      // Mengubah private key menjadi objek akun
      const accountInfo = new ethers.Wallet(formattedPrivateKey, provider); // Menghubungkan wallet ke provider
    } catch (error) {
      logger.error(`Kesalahan saat mengonversi private key: ${error.message}`); // Menggunakan logger untuk mencatat kesalahan
      continue; // Melanjutkan ke akun berikutnya jika ada kesalahan
    }

    // Meminta input dari pengguna
    const swapAmount = await askQuestion('Masukkan jumlah ETH yang ingin Anda tukar: ');
    const swapCount = await askQuestion('Masukkan jumlah kali Anda ingin melakukan swap: ');

    // Membuat instance EthereumClient dan HemiSepolia
    const ethClient = new EthereumClient(formattedPrivateKey);
    const hemiSepoliaClient = new HemiSepolia(formattedPrivateKey);

    // Menyetor ETH dan menukar token
    for (let i = 0; i < parseInt(swapCount); i++) {
      try {
        await ethClient.depositETH(50000, '0x0', swapAmount); // Sesuaikan jumlah dan nilai sesuai kebutuhan
        await hemiSepoliaClient.swapWeth(swapAmount);
        await hemiSepoliaClient.swapDai(swapAmount);
      } catch (error) {
        logger.error(`Kesalahan saat melakukan deposit atau swap: ${error.message}`); // Menggunakan logger untuk mencatat kesalahan
      }
    }
  }
  rl.close(); // Menutup readline
})();
