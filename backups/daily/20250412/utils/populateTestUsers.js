import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quantum_balance')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Import models
      const userModule = await import('../models/User.js');
      const packageModule = await import('../models/Package.js');
      const User = userModule.default;
      const Package = packageModule.default;
      
      // Get all packages from the database
      const packages = await Package.find({}).sort({ price: 1 });
      
      if (packages.length === 0) {
        console.error('❌ No packages found. Please run the populatePackages.js script first.');
        return;
      }
      
      console.log(`Found ${packages.length} packages in the database.`);
      
      // Get test users (those with @test.com email)
      const testUsers = await User.find({ email: /.*@test\.com$/ });
      console.log(`Found ${testUsers.length} test users to update.`);
      
      if (testUsers.length === 0) {
        console.log('No test users found. Creating a test user with a package...');
        
        // Create a test user with the enhanced package
        const enhancedPackage = packages.find(pkg => pkg.type === 'enhanced');
        
        if (!enhancedPackage) {
          console.error('❌ Enhanced package not found.');
          return;
        }
        
        // Calculate expiry date (30 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + enhancedPackage.durationDays);
        
        const newUser = new User({
          name: 'Test User',
          email: 'user@test.com',
          username: 'testuser',
          password: 'password123',
          packageType: enhancedPackage.type,
          activePackage: {
            packageId: enhancedPackage._id,
            name: enhancedPackage.name,
            expiresAt: expiryDate
          },
          isVerified: true
        });
        
        await newUser.save();
        console.log(`✅ Created test user: ${newUser.email} with ${enhancedPackage.name} package`);
      } else {
        // Update existing test users with packages
        for (const user of testUsers) {
          // Find a suitable package based on email domain or other criteria
          const packageIndex = Math.floor(Math.random() * packages.length);
          const selectedPackage = packages[packageIndex];
          
          // Calculate expiry date
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + selectedPackage.durationDays);
          
          // Create a mock Stripe payment intent ID for simulation
          const mockStripePaymentIntentId = `pi_test_${Math.random().toString(36).substring(2, 10)}`;
          
          // Create a new user package
          const userPackage = new UserPackage({
            user: user._id,
            package: selectedPackage._id,
            packageType: selectedPackage.type,
            expiryDate,
            price: selectedPackage.price,
            stripePaymentIntentId: mockStripePaymentIntentId,
            paymentStatus: 'completed'
          });
          
          await userPackage.save();
          
          // Update user's package info
          user.packageType = selectedPackage.type;
          user.activePackage = {
            packageId: selectedPackage._id,
            name: selectedPackage.name,
            expiresAt: expiryDate
          };
          
          await user.save();
          
          console.log(`✅ Updated user: ${user.email} with ${selectedPackage.name} package`);
        }
      }
      
      console.log('\nTest users updated successfully!');
    } catch (error) {
      console.error('❌ Error updating test users:', error);
    } finally {
      // Close database connection
      await mongoose.connection.close();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  }); 