const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const Client = require('../models/Client'); // Make sure Client model is imported

const checkAndCreateInvoices = async () => {
  console.log(`[Cron Job] Running check for recurring invoices at ${new Date().toISOString()}`);
  const now = new Date();
  
  try {
    // Find subscriptions due today or earlier and populate their client info
    const dueSubscriptions = await Subscription.find({
      nextDueDate: { $lte: now } // Find all subscriptions due now or in the past
    }).populate('client'); // <-- This links to the Client collection

    if (dueSubscriptions.length === 0) {
      console.log('[Cron Job] No recurring invoices due today.');
      return;
    }

    console.log(`[Cron Job] Found ${dueSubscriptions.length} subscriptions to process.`);

    for (const sub of dueSubscriptions) {
      // Check if client exists (it might have been deleted)
      if (!sub.client) {
        console.warn(`[Cron Job] Subscription ${sub._id} has a missing or deleted client. Skipping.`);
        continue;
      }
      
      // 1. Create the new invoice
      const newInvoice = new Invoice({
        user: sub.user,
        clientName: sub.client.name, // <-- Use the client's name
        clientEmail: sub.client.email, // <-- Use the client's email
        description: sub.description,
        amount: sub.amount,
        status: 'pending'
      });
      await newInvoice.save();

      // 2. Calculate the next due date
      const nextDate = new Date(sub.nextDueDate);
      if (sub.frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (sub.frequency === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      // 3. Update the subscription's next due date
      sub.nextDueDate = nextDate;
      await sub.save();
      
      console.log(`[Cron Job] Successfully created new invoice (ID: ${newInvoice._id}) for subscription ${sub._id}`);
    }
  } catch (err) {
    console.error('[Cron Job] Error checking and creating invoices:', err);
  }
};

// This function will be called from index.js to start the scheduler
const startSubscriptionJob = () => {
  console.log('[Cron Job] Scheduler started. Will run daily at 3:00 AM (Asia/Kolkata).');
  
  // Schedule the job to run once per day at 3:00 AM
  // For testing, you can change this string to '*/30 * * * * *' (every 30 seconds)
  cron.schedule('0 3 * * *', checkAndCreateInvoices, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Important: Set to your server's timezone
  });
};

module.exports = { startSubscriptionJob };