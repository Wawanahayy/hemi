// logger.js
import winston from 'winston';

// Konfigurasi logger Winston
const logger = winston.createLogger({
  level: 'info', // Mengatur tingkat log menjadi 'info'
  format: winston.format.combine(
    winston.format.timestamp({
      // Format timestamp yang disesuaikan
      format: () => {
        const date = new Date();
        // Mengonversi waktu ke UTC+8
        const utc8Date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
        return utc8Date.toISOString(); // Mengembalikan string waktu dalam format ISO
      }
    }),
    winston.format.json() // Format output log dalam JSON
  ),
  transports: [
    // Mengoutput log kesalahan ke file 'error.log'
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // Mengoutput semua log ke file 'combined.log'
    new winston.transports.File({ filename: 'combined.log' }),
    // Mengoutput semua log ke konsol
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Menambahkan warna pada output
        winston.format.simple() // Menggunakan format sederhana untuk output
      )
    })
  ],
});

// Mengekspor logger
export default logger;
