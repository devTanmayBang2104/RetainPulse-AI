/**
 * Seed Script
 * Reads the Telco CSV and seeds MongoDB with real customer data
 * Run: node src/utils/seedData.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
const mongoose = require("mongoose");
const fs = require("fs");
const { parse } = require("csv-parse/sync");
const Customer = require("../models/Customer");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/telecom_retention";

const CSV_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "data",
  "Telco_Customer_Churn.csv"
);

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing customers
    await Customer.deleteMany({});
    console.log("🗑️  Cleared existing customers");

    // Read CSV
    const csvContent = fs.readFileSync(CSV_PATH, "utf8");
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`📄 Read ${records.length} records from CSV`);

    // Map CSV columns to schema
    const customers = records.map((row, idx) => {
      const totalCharges = parseFloat(row.TotalCharges);
      const churnProb = row.Churn === "Yes" ? Math.random() * 0.3 + 0.6 : Math.random() * 0.35;
      const riskLevel = churnProb >= 0.7 ? "HIGH" : churnProb >= 0.4 ? "MEDIUM" : "LOW";

      return {
        customerId: row.customerID || `CUST-${String(idx + 1).padStart(5, "0")}`,
        gender: row.gender,
        seniorCitizen: parseInt(row.SeniorCitizen) || 0,
        partner: row.Partner,
        dependents: row.Dependents,
        tenure: parseInt(row.tenure) || 0,
        phoneService: row.PhoneService,
        multipleLines: row.MultipleLines,
        internetService: row.InternetService,
        onlineSecurity: row.OnlineSecurity,
        onlineBackup: row.OnlineBackup,
        deviceProtection: row.DeviceProtection,
        techSupport: row.TechSupport,
        streamingTV: row.StreamingTV,
        streamingMovies: row.StreamingMovies,
        contract: row.Contract,
        paperlessBilling: row.PaperlessBilling,
        paymentMethod: row.PaymentMethod,
        monthlyCharges: parseFloat(row.MonthlyCharges) || 0,
        totalCharges: isNaN(totalCharges) ? 0 : totalCharges,
        isChurned: row.Churn === "Yes",
        churnProbability: parseFloat(churnProb.toFixed(4)),
        riskLevel,
        lastPredictionAt: new Date(),
      };
    });

    // Insert in batches of 500
    const batchSize = 500;
    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize);
      await Customer.insertMany(batch, { ordered: false });
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}`);
    }

    console.log(`\n🎉 Seeded ${customers.length} customers successfully!`);
    console.log(`   High Risk: ${customers.filter(c => c.riskLevel === "HIGH").length}`);
    console.log(`   Medium Risk: ${customers.filter(c => c.riskLevel === "MEDIUM").length}`);
    console.log(`   Low Risk: ${customers.filter(c => c.riskLevel === "LOW").length}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  }
}

seed();
