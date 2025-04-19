import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum_balance')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Import the Package model
      const packageModule = await import('../models/Package.js');
      const Package = packageModule.default;
      
      // Delete all existing packages
      await Package.deleteMany({});
      console.log('Deleted existing packages');
      
      // Default packages data
      const defaultPackages = [
        {
          name: 'Single Session',
          type: 'single',
          price: 15,
          description: 'Perfect for trying out our service with a single healing session.',
          features: [
            'Two Sonic Prescriptions',
            '3-day access',
            'Basic Support'
          ],
          durationDays: 3,
          maxPrescriptions: 2,
          active: true
        },
        {
          name: 'Basic Plan',
          type: 'basic',
          price: 25,
          description: 'Foundational healing with key sonic prescriptions for common needs.',
          features: [
            'Sleep, Detox, Immunity Sonic Prescriptions',
            '+1 Add-on Sonic Prescription',
            '15-Day Access',
            'Basic Support'
          ],
          durationDays: 15,
          maxPrescriptions: 4,
          active: true
        },
        {
          name: 'Enhanced Plan',
          type: 'enhanced',
          price: 45,
          description: 'Comprehensive healing approach with expanded prescription options.',
          features: [
            'Sleep, Detox, Immunity',
            '+3 Add-on Prescriptions',
            '30-Day Access',
            'Basic Support'
          ],
          durationDays: 30,
          maxPrescriptions: 7,
          active: true,
          highlight: true
        },
        {
          name: 'Premium Plan',
          type: 'premium',
          price: 75,
          description: 'Our most comprehensive offering with full access to all healing technologies.',
          features: [
            'Complete Sonic Prescriptions Library',
            '30-Day Access',
            'Priority Support',
            'Custom Healing Programs'
          ],
          durationDays: 30,
          maxPrescriptions: 0, // Unlimited
          active: true,
          badge: 'Best Value'
        }
      ];
      
      // Insert packages into database
      const insertedPackages = await Package.insertMany(defaultPackages);
      console.log(`✅ Successfully added ${insertedPackages.length} packages to database`);
      
      // Display added packages
      console.log('Packages added:');
      insertedPackages.forEach(pkg => {
        console.log(`- ${pkg.name} (ID: ${pkg._id}, Type: ${pkg.type}, Price: $${pkg.price})`);
      });
      
      console.log('\nPackage population complete! You can now use these packages in your application.');
      
      // Cleanup - delete the unneeded seedPackages.js file
      try {
        const seedPackagesPath = path.join(__dirname, '../scripts/seedPackages.js');
        if (fs.existsSync(seedPackagesPath)) {
          fs.unlinkSync(seedPackagesPath);
          console.log('✅ Removed unnecessary seedPackages.js file');
        }
      } catch (fileError) {
        console.log('Note: Could not remove seedPackages.js file:', fileError.message);
      }
      
    } catch (error) {
      console.error('❌ Error populating packages:', error);
    } finally {
      // Close database connection
      await mongoose.connection.close();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  }); 