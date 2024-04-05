import transactions from "./data/transactions.json" assert { type: 'json' }
import TransactionEntry from "./models/transaction.js"
import connectDB from './config/db.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

connectDB()

async function seed() {
  await TransactionEntry.deleteMany()
  await TransactionEntry.insertMany(transactions)
  console.log("Data imported successfully")
}

await seed()
