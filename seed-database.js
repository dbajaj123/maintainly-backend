const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Society = require('./models/Society');
const Task = require('./models/Task');
const Asset = require('./models/Asset');
const AssetLibraryItem = require('./models/AssetLibraryItem');

// Import the existing data
const importedData = require('./imported-data.json');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB for seeding'))
.catch(err => {
  console.error('❌ MongoDB connection failed:', err);
  process.exit(1);
});

// Sample societies data
const sampleSocieties = [
  {
    name: 'Green Valley Apartments',
    address: '123 Green Valley Road, Sector 18, Gurgaon, Haryana 122015',
    contactPerson: 'Rajesh Kumar',
    contactEmail: 'rajesh@greenvalley.com',
    contactPhone: '+91 9876543210',
    totalUnits: 120,
    amenities: ['Swimming Pool', 'Gym', 'Garden', 'Security'],
    isActive: true
  },
  {
    name: 'Sunset Heights',
    address: '456 Sunset Boulevard, Koramangala, Bangalore, Karnataka 560034',
    contactPerson: 'Priya Sharma',
    contactEmail: 'priya@sunsetheights.com',
    contactPhone: '+91 9876543211',
    totalUnits: 85,
    amenities: ['Clubhouse', 'Children Play Area', 'Security'],
    isActive: true
  },
  {
    name: 'Royal Gardens',
    address: '789 Royal Garden Street, Banjara Hills, Hyderabad, Telangana 500034',
    contactPerson: 'Amit Patel',
    contactEmail: 'amit@royalgardens.com',
    contactPhone: '+91 9876543212',
    totalUnits: 200,
    amenities: ['Swimming Pool', 'Gym', 'Garden', 'Clubhouse', 'Security', 'Parking'],
    isActive: true
  },
  {
    name: 'Ocean View Residency',
    address: '321 Marine Drive, Worli, Mumbai, Maharashtra 400018',
    contactPerson: 'Sneha Reddy',
    contactEmail: 'sneha@oceanview.com',
    contactPhone: '+91 9876543213',
    totalUnits: 150,
    amenities: ['Sea View', 'Gym', 'Security', 'Parking'],
    isActive: true
  },
  {
    name: 'Maple Woods Society',
    address: '654 Maple Street, Gomti Nagar, Lucknow, Uttar Pradesh 226010',
    contactPerson: 'Vikram Singh',
    contactEmail: 'vikram@maplewoods.com',
    contactPhone: '+91 9876543214',
    totalUnits: 95,
    amenities: ['Garden', 'Children Play Area', 'Security'],
    isActive: true
  }
];

// Sample asset library items
const sampleAssetLibrary = [
  {
    name: 'Otis Elevator Model X200',
    category: 'elevator',
    description: 'High-speed passenger elevator suitable for residential buildings',
    manufacturer: 'Otis',
    model: 'X200',
    specifications: 'Max Load: 1000kg, Speed: 1.5m/s, 10 floors capacity',
    maintenanceInterval: 'monthly',
    estimatedLifespan: '25 years',
    isActive: true
  },
  {
    name: 'Grundfos Centrifugal Pump CR32',
    category: 'water_pump',
    description: 'High-efficiency centrifugal water pump for residential water supply',
    manufacturer: 'Grundfos',
    model: 'CR32-4',
    specifications: 'Flow: 32 m³/h, Head: 40m, Power: 5.5kW',
    maintenanceInterval: 'quarterly',
    estimatedLifespan: '15 years',
    isActive: true
  },
  {
    name: 'Cummins Diesel Generator C250D5',
    category: 'generator',
    description: 'Reliable diesel generator for backup power supply',
    manufacturer: 'Cummins',
    model: 'C250D5',
    specifications: 'Power: 250kVA, Fuel: Diesel, Auto start/stop',
    maintenanceInterval: 'monthly',
    estimatedLifespan: '20 years',
    isActive: true
  },
  {
    name: 'Hikvision IP Camera DS-2CD2045FWD-I',
    category: 'cctv',
    description: '4MP Network Bullet Camera with IR for outdoor surveillance',
    manufacturer: 'Hikvision',
    model: 'DS-2CD2045FWD-I',
    specifications: '4MP, IR 30m, IP67, H.265+',
    maintenanceInterval: 'half_yearly',
    estimatedLifespan: '8 years',
    isActive: true
  },
  {
    name: 'Fire Extinguisher ABC Dry Powder',
    category: 'fire_safety',
    description: 'Multi-purpose dry powder fire extinguisher',
    manufacturer: 'Ceasefire',
    model: 'ABC-6KG',
    specifications: '6kg capacity, ABC class fires, ISI certified',
    maintenanceInterval: 'yearly',
    estimatedLifespan: '10 years',
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await User.deleteMany({ email: { $ne: 'admin@maintainly.com' } });
    // await Society.deleteMany({});
    // await Task.deleteMany({});
    // await Asset.deleteMany({});
    // await AssetLibraryItem.deleteMany({});

    // Create admin user first
    const existingAdmin = await User.findOne({ email: 'admin@maintainly.com' });
    let adminUser;
    if (!existingAdmin) {
      const hashedAdminPassword = await bcrypt.hash('admin123', 12);
      adminUser = new User({
        email: 'admin@maintainly.com',
        password: hashedAdminPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'Admin',
        isActive: true
      });
      await adminUser.save();
      console.log('✅ Created admin user: admin@maintainly.com');
    } else {
      adminUser = existingAdmin;
      console.log('ℹ️  Admin user already exists');
    }

    // Create manager user
    const existingManager = await User.findOne({ email: 'manager@maintainly.com' });
    if (!existingManager) {
      const hashedPassword = await bcrypt.hash('manager123', 12);
      const manager = new User({
        email: 'manager@maintainly.com',
        password: hashedPassword,
        firstName: 'Property',
        lastName: 'Manager',
        role: 'Manager',
        phone: '+91 9876543200',
        adminId: adminUser._id,
        isActive: true
      });
      await manager.save();
      console.log('✅ Created manager user: manager@maintainly.com');
    } else {
      console.log('ℹ️  Manager user already exists');
    }

    // Create additional sample managers
    const sampleManagers = [
      {
        email: 'john.manager@maintainly.com',
        firstName: 'John',
        lastName: 'Smith',
        phone: '+91 9876543201'
      },
      {
        email: 'sarah.manager@maintainly.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '+91 9876543202'
      }
    ];

    for (const managerData of sampleManagers) {
      const existing = await User.findOne({ email: managerData.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash('manager123', 12);
        const manager = new User({
          ...managerData,
          password: hashedPassword,
          role: 'Manager',
          adminId: adminUser._id,
          isActive: true
        });
        await manager.save();
        console.log(`✅ Created manager: ${managerData.email}`);
      }
    }

    // Create societies
    console.log('🏢 Creating societies...');
    const createdSocieties = [];
    for (const societyData of sampleSocieties) {
      const existing = await Society.findOne({ name: societyData.name });
      if (!existing) {
        // Parse the address string into address object if needed
        let addressObj = societyData.address;
        if (typeof societyData.address === 'string') {
          // Parse address string for legacy format
          const addressParts = societyData.address.split(', ');
          addressObj = {
            street: addressParts[0] || 'Street Address',
            city: addressParts[1] || 'City',
            state: addressParts[2] || 'State',
            zipCode: addressParts[3] || '000000',
            country: 'India'
          };
        }

        const societyWithAdmin = {
          ...societyData,
          address: addressObj,
          adminId: adminUser._id,
          contactInfo: societyData.contactInfo || {
            primaryContact: {
              name: societyData.contactPerson || 'Contact Person',
              email: societyData.contactEmail || 'contact@society.com',
              phone: societyData.contactPhone || '+91 9876543210'
            }
          }
        };

        const society = new Society(societyWithAdmin);
        await society.save();
        createdSocieties.push(society);
        console.log(`✅ Created society: ${society.name}`);
      } else {
        createdSocieties.push(existing);
        console.log(`ℹ️  Society already exists: ${existing.name}`);
      }
    }

    // Create asset library items
    console.log('📚 Creating asset library items...');
    for (const itemData of sampleAssetLibrary) {
      const existing = await AssetLibraryItem.findOne({ name: itemData.name });
      if (!existing) {
        // Map categories to valid enum values
        let validCategory = itemData.category;
        const categoryMap = {
          'elevator': 'Elevator',
          'water_pump': 'Plumbing',
          'generator': 'Generator',
          'cctv': 'Security',
          'fire_safety': 'Fire Safety'
        };
        
        if (categoryMap[itemData.category]) {
          validCategory = categoryMap[itemData.category];
        }

        const itemWithAdmin = {
          ...itemData,
          category: validCategory,
          adminId: adminUser._id
        };

        const item = new AssetLibraryItem(itemWithAdmin);
        await item.save();
        console.log(`✅ Created asset library item: ${item.name}`);
      } else {
        console.log(`ℹ️  Asset library item already exists: ${existing.name}`);
      }
    }

    // Create assets for societies
    console.log('🏗️  Creating assets...');
    
    // Get created asset library items for reference
    const assetLibraryItems = await AssetLibraryItem.find({});
    
    for (const society of createdSocieties) {
      for (let i = 0; i < Math.min(3, assetLibraryItems.length); i++) {
        const libraryItem = assetLibraryItems[i];
        const assetData = {
          name: `${libraryItem.name} - ${society.name.split(' ')[0]} Unit ${i + 1}`,
          assetLibraryItemId: libraryItem._id,
          societyId: society._id,
          adminId: adminUser._id,
          location: {
            building: `Block ${String.fromCharCode(65 + i)}`,
            floor: `Floor ${Math.floor(Math.random() * 10) + 1}`,
            description: `${society.name} - Unit ${i + 1}`
          },
          serialNumber: `SN${Date.now()}${i}`,
          installationDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
          warrantyExpiry: new Date(2025 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
          condition: ['Excellent', 'Good', 'Fair'][Math.floor(Math.random() * 3)],
          isActive: true
        };

        const existing = await Asset.findOne({ 
          name: assetData.name, 
          societyId: society._id 
        });
        
        if (!existing) {
          const asset = new Asset(assetData);
          await asset.save();
          console.log(`✅ Created asset: ${asset.name}`);
        }
      }
    }

    // Process imported tasks and create them in the database
    console.log('📋 Processing imported tasks...');
    
    // Get created assets for task assignment
    const createdAssets = await Asset.find({});
    const managerUser = await User.findOne({ email: 'manager@maintainly.com' });
    
    if (importedData.tasks && importedData.tasks.length > 0 && createdAssets.length > 0) {
      let processedCount = 0;
      const maxTasks = Math.min(20, importedData.tasks.length); // Limit to first 20 tasks

      for (let i = 0; i < maxTasks; i++) {
        const taskData = importedData.tasks[i];
        
        // Map priority values
        let priority = 'Medium';
        if (taskData.categoryNature === 'Admin' || taskData.priority === 'high') {
          priority = 'High';
        } else if (taskData.priority === 'low') {
          priority = 'Low';
        }
        
        // Map status values
        let status = 'Pending';
        if (taskData.currentStatus === 'CL' || taskData.status === 'completed') {
          status = 'Completed';
        } else if (taskData.currentStatus === 'In Progress' || taskData.status === 'in-progress') {
          status = 'InProgress';
        }
        
        // Calculate scheduled date
        const baseDate = new Date();
        const scheduledDate = new Date(baseDate.getTime() + (Math.random() * 30) * 24 * 60 * 60 * 1000); // Random date within 30 days
        
        const mappedTask = {
          title: taskData.taskDescription || taskData.description || `Imported Task ${i + 1}`,
          description: taskData.taskDescription || taskData.description || 'Task imported from Excel data',
          assetId: createdAssets[i % createdAssets.length]._id,
          societyId: createdSocieties[i % createdSocieties.length]._id,
          adminId: adminUser._id,
          assignedManagerId: managerUser._id,
          priority: priority,
          status: status,
          scheduledDate: scheduledDate,
          estimatedDuration: (taskData.daysGranted * 8 * 60) || 480, // Convert days to minutes
          isActive: true
        };

        const existing = await Task.findOne({ 
          title: mappedTask.title, 
          assetId: mappedTask.assetId 
        });

        if (!existing) {
          const task = new Task(mappedTask);
          await task.save();
          processedCount++;
        }
      }

      console.log(`✅ Processed ${processedCount} tasks from imported data`);
    } else {
      console.log('ℹ️  No imported data or assets found for task creation');
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Societies: ${await Society.countDocuments()}`);
    console.log(`- Tasks: ${await Task.countDocuments()}`);
    console.log(`- Assets: ${await Asset.countDocuments()}`);
    console.log(`- Asset Library Items: ${await AssetLibraryItem.countDocuments()}`);
    console.log(`- Users: ${await User.countDocuments()}`);

    console.log('\n👥 User Accounts:');
    console.log('- admin@maintainly.com (password: admin123)');
    console.log('- manager@maintainly.com (password: manager123)');
    console.log('- john.manager@maintainly.com (password: manager123)');
    console.log('- sarah.manager@maintainly.com (password: manager123)');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the seeding
seedDatabase();