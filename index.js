import { http, createWalletClient, createPublicClient, parseEther, encodeFunctionData } from "viem";
import { hemiPublicBitcoinKitActions, hemiPublicOpNodeActions, hemiSepolia } from "hemi-viem";
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from "viem/chains";
import logger from './logger.js'; // Mengimpor logger
import hemiABI from './abi.js';
import WETHABI from './WETH.js';
import UNIABI from './uniswap.js';
import { accounts } from './config.js'; // Mengimpor file konfigurasi

// Kelas EthereumClient, digunakan untuk berinteraksi dengan blockchain Ethereum
class EthereumClient {
  constructor(privateKey) {
    this.parameters = { chain: sepolia, transport: http() };
    this.account = privateKeyToAccount(privateKey);

    // Membuat klien dompet
    this.walletClient = createWalletClient({
      account: this.account,
      ...this.parameters
    });

    this.publicClient = createPublicClient({
      ...this.parameters,
    });
  }

  // Menyetorkan ETH ke kontrak proxy
  async depositETH(minGasLimit, extraData, amount) {
    const proxyContractAddress = '0xc94b1BEe63A3e101FE5F71C80F912b4F4b055925';
    const sendEth = parseEther(amount.toString());

    // Memeriksa apakah saldo lebih besar dari jumlah deposit
    const { address } = this.account;
    const balance = await this.publicClient.getBalance({
      address,
    });

    if (balance < sendEth) {
      logger.error(`Saldo tidak mencukupi, silakan deposit ETH lebih dulu, saldo saat ini: ${balance}`); // Menggunakan logger untuk mencatat kesalahan
      throw new Error('Saldo tidak valid'); // Membuang error untuk menghentikan operasi
    }

    // Mengkodekan data fungsi
    const data = encodeFunctionData({
      abi: hemiABI,
      functionName: 'depositETH',
      args: [minGasLimit, extraData]
    });

    try {
      // Mengirim transaksi
      const tx = await this.walletClient.sendTransaction({
        to: proxyContractAddress,
        data,
        value: sendEth,
      });

      logger.info(`Transaksi terkirim: ${tx}`); // Menggunakan logger untuk mencatat informasi transaksi
    } catch (error) {
      logger.error(`Terjadi kesalahan saat mengirim transaksi: ${error.message}`); // Menggunakan logger untuk mencatat kesalahan
      throw error; // Membuang error agar bisa ditangkap di luar
    }
  }
}

// Kelas HemiSepolia, digunakan untuk menangani operasi terkait Hemi Sepolia
class HemiSepolia {
  constructor(privateKey) {
    // Menetapkan parameter rantai dan transportasi
    this.parameters = { chain: hemiSepolia, transport: http() };
    this.account = privateKeyToAccount(privateKey);

    // Membuat klien publik
    this.publicClient = createPublicClient(this.parameters)
      .extend(hemiPublicOpNodeActions())
      .extend(hemiPublicBitcoinKitActions());

    // Membuat klien dompet
    this.walletClient = createWalletClient({
      account: this.account,
      ...this.parameters
    });
  }

  // Metode untuk menukar WETH
  async swapWeth() {
    const WethContractAddress = '0x0C8aFD1b58aa2A5bAd2414B861D8A7fF898eDC3A';
    const sendEth = parseEther('0.00001');

    // Memeriksa saldo
    const { address } = this.account;
    const balance = await this.publicClient.getBalance({
      address,
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
      // Mengirim transaksi
      const tx = await this.walletClient.sendTransaction({
        to: WethContractAddress,
        data,
        value: sendEth,
      });

      logger.info(`Transaksi WETH terkirim: ${tx}`); // Menggunakan logger untuk mencatat informasi transaksi
    } catch (error) {
      logger.error(`Terjadi kesalahan saat menukar WETH: ${error.message}`); // Menggunakan logger untuk mencatat kesalahan
      throw error; // Membuang error agar bisa ditangkap di luar
    }
  }

  // Metode untuk menukar DAI
  async swapDai() {
    const UniswapContractAddress = '0xA18019E62f266C2E17e33398448e4105324e0d0F';
    const sendEth = parseEther('0.00001');

    const { address } = this.account;
    const balance = await this.publicClient.getBalance({
      address,
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
      // Mengirim transaksi
      const tx = await this.walletClient.sendTransaction({
        to: UniswapContractAddress,
        data,
        value: sendEth,
      });

      logger.info(`Transaksi DAI terkirim: ${tx}`); // Menggunakan logger untuk mencatat informasi transaksi
    } catch (error) {
      logger.error(`Terjadi kesalahan saat menukar DAI: ${error.message}`); // Menggunakan logger untuk mencatat kesalahan
      throw error; // Membuang error agar bisa ditangkap di luar
    }
  }
}

// Contoh penggunaan
(async () => {
  for (const account of accounts) {
    const { privateKey } = account;

    // Memeriksa format private key, tambahkan '0x' jika tidak dimulai dengan '0x'
    let formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;

    try {
      // Mengubah private key menjadi objek akun
      const accountInfo = privateKeyToAccount(formattedPrivateKey);
    } catch (error) {
      logger.error(`Kesalahan saat mengonversi akun: ${error.message} (Private key: ${privateKey})`);
      continue; // Lewati akun saat ini, lanjutkan ke akun berikutnya
    }

    try {
      // Membuat klien Ethereum dan melakukan deposit
      const ethClient = new EthereumClient(formattedPrivateKey);
      await ethClient.depositETH(200000, '0x', 0.1);
    } catch (error) {
      logger.error(`Kesalahan saat deposit: ${error.message} (Private key: ${privateKey})`);
      continue; // Lewati akun saat ini, lanjutkan ke akun berikutnya
    }

    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      // Membuat klien Hemi Sepolia dan melakukan swap WETH dan DAI
      const hemiSepolia = new HemiSepolia(formattedPrivateKey);
      // Tukar WETH
      await hemiSepolia.swapWeth();

      await new Promise(resolve => setTimeout(resolve, 5000));

      // Tukar DAI
      await hemiSepolia.swapDai();
    } catch (error) {
      logger.error(`Kesalahan saat operasi Hemi Sepolia: ${error.message} (Private key: ${privateKey})`);
    }
  }

  process.exit(0);
})();
