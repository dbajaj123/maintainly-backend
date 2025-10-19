const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Society = require('./models/Society');
const Task = require('./models/Task');
const Asset = require('./models/Asset');
const AssetLibraryItem = require('./models/AssetLibraryItem');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection failed:', err);
  process.exit(1);
});

const resetDatabase = async () => {
  try {
    console.log('🗑️  Clearing all data...');
    
    // Delete all data
    await User.deleteMany({});
    await Society.deleteMany({});
    await Task.deleteMany({});
    await Asset.deleteMany({});
    await AssetLibraryItem.deleteMany({});
    
    console.log('✅ All data cleared');
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedAdminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = new User({
      email: 'admin@maintainly.com',
      password: hashedAdminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'Admin',
      isActive: true
    });
    await adminUser.save();
    console.log('✅ Admin created:', adminUser.email, '| ID:', adminUser._id);
    
    // Create managers
    console.log('👥 Creating managers...');
    const managers = [
      {
        email: 'manager@maintainly.com',
        firstName: 'Property',
        lastName: 'Manager',
        phone: '+91 9876543200'
      },
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
    
    const createdManagers = [];
    for (const managerData of managers) {
      const hashedPassword = await bcrypt.hash('manager123', 12);
      const manager = new User({
        ...managerData,
        password: hashedPassword,
        role: 'Manager',
        adminId: adminUser._id,
        isActive: true
      });
      await manager.save();
      createdManagers.push(manager);
      console.log('✅ Manager created:', manager.email, '| ID:', manager._id);
    }
    
    // Create societies
    console.log('🏢 Creating societies...');
    const societies = [
      {
        name: 'Green Valley Apartments',
        address: {
          street: '123 Green Valley Road',
          city: 'Sector 18',
          state: 'Gurgaon',
          zipCode: 'Haryana 122015',
          country: 'India'
        },
        contactInfo: {
          primaryContact: {
            name: 'Rajesh Kumar',
            phone: '+91 9876543210',
            email: 'rajesh@greenvalley.com'
          }
        },
        totalUnits: 120
      },
      {
        name: 'Sunset Heights',
        address: {
          street: '456 Sunset Boulevard',
          city: 'Koramangala',
          state: 'Bangalore',
          zipCode: 'Karnataka 560034',
          country: 'India'
        },
        contactInfo: {
          primaryContact: {
            name: 'Priya Sharma',
            phone: '+91 9876543211',
            email: 'priya@sunsetheights.com'
          }
        },
        totalUnits: 85
      },
      {
        name: 'Royal Gardens',
        address: {
          street: '789 Royal Garden Street',
          city: 'Banjara Hills',
          state: 'Hyderabad',
          zipCode: 'Telangana 500034',
          country: 'India'
        },
        contactInfo: {
          primaryContact: {
            name: 'Amit Patel',
            phone: '+91 9876543212',
            email: 'amit@royalgardens.com'
          }
        },
        totalUnits: 200
      },
      {
        name: 'Ocean View Residency',
        address: {
          street: '321 Marine Drive',
          city: 'Worli',
          state: 'Mumbai',
          zipCode: 'Maharashtra 400018',
          country: 'India'
        },
        contactInfo: {
          primaryContact: {
            name: 'Sneha Reddy',
            phone: '+91 9876543213',
            email: 'sneha@oceanview.com'
          }
        },
        totalUnits: 150
      },
      {
        name: 'Maple Woods Society',
        address: {
          street: '654 Maple Street',
          city: 'Gomti Nagar',
          state: 'Lucknow',
          zipCode: 'Uttar Pradesh 226010',
          country: 'India'
        },
        contactInfo: {
          primaryContact: {
            name: 'Vikram Singh',
            phone: '+91 9876543214',
            email: 'vikram@maplewoods.com'
          }
        },
        totalUnits: 95
      }
    ];
    
    const createdSocieties = [];
    for (const societyData of societies) {
      const society = new Society({
        ...societyData,
        adminId: adminUser._id,
        isActive: true
      });
      await society.save();
      createdSocieties.push(society);
      console.log('✅ Society created:', society.name, '| ID:', society._id);
    }
    
    // Create asset library items
    console.log('📚 Creating asset library items...');
    const assetLibraryItems = [
      {
        name: 'Otis Elevator Model X200',
        category: 'Elevator',
        description: 'High-speed passenger elevator suitable for residential buildings',
        manufacturer: 'Otis',
        model: 'X200',
        specifications: 'Max Load: 1000kg, Speed: 1.5m/s, 10 floors capacity',
        maintenanceFrequency: 'Monthly',
        estimatedLifespan: '25 years'
      },
      {
        name: 'Grundfos Centrifugal Pump CR32',
        category: 'Water System',
        description: 'High-efficiency centrifugal water pump for residential water supply',
        manufacturer: 'Grundfos',
        model: 'CR32-4',
        specifications: 'Flow: 32 m³/h, Head: 40m, Power: 5.5kW',
        maintenanceFrequency: 'Quarterly',
        estimatedLifespan: '15 years'
      },
      {
        name: 'Cummins Diesel Generator C250D5',
        category: 'Generator',
        description: 'Reliable diesel generator for backup power supply',
        manufacturer: 'Cummins',
        model: 'C250D5',
        specifications: 'Power: 250kVA, Fuel: Diesel, Auto start/stop',
        maintenanceFrequency: 'Monthly',
        estimatedLifespan: '20 years'
      },
      {
        name: 'Hikvision CCTV Camera DS-2CD2185',
        category: 'Security',
        description: '8MP IP CCTV camera with night vision',
        manufacturer: 'Hikvision',
        model: 'DS-2CD2185',
        specifications: '8MP resolution, 30m IR range, IP67',
        maintenanceFrequency: 'Quarterly',
        estimatedLifespan: '7 years'
      },
      {
        name: 'Daikin VRV HVAC System',
        category: 'HVAC',
        description: 'Variable refrigerant volume air conditioning system',
        manufacturer: 'Daikin',
        model: 'VRV-IV',
        specifications: 'Energy efficient, quiet operation, multi-zone',
        maintenanceFrequency: 'Quarterly',
        estimatedLifespan: '15 years'
      }
    ];
    
    const createdAssetLibraryItems = [];
    for (const itemData of assetLibraryItems) {
      const item = new AssetLibraryItem({
        ...itemData,
        adminId: adminUser._id,
        isActive: true
      });
      await item.save();
      createdAssetLibraryItems.push(item);
      console.log('✅ Asset library item created:', item.name, '| ID:', item._id);
    }
    
    // Create assets for societies
    console.log('🏗️  Creating assets...');
    const assetsData = [
      {
        societyId: createdSocieties[0]._id,
        assetLibraryItemId: createdAssetLibraryItems[0]._id, // Elevator
        name: 'Main Lobby Elevator A',
        location: {
          description: 'Tower A - Main Lobby'
        },
        serialNumber: 'OTIS-GV-A-001',
        installationDate: new Date('2020-03-15'),
        condition: 'Good'
      },
      {
        societyId: createdSocieties[0]._id,
        assetLibraryItemId: createdAssetLibraryItems[1]._id, // Water Pump
        name: 'Building Water Pump',
        location: {
          description: 'Basement - Pump Room'
        },
        serialNumber: 'GF-CR32-001',
        installationDate: new Date('2019-06-20'),
        condition: 'Excellent'
      },
      {
        societyId: createdSocieties[1]._id,
        assetLibraryItemId: createdAssetLibraryItems[2]._id, // Generator
        name: 'Backup Generator',
        location: {
          description: 'Ground Floor - Generator Room'
        },
        serialNumber: 'CMMNS-250-SH-001',
        installationDate: new Date('2021-01-10'),
        condition: 'Good'
      },
      {
        societyId: createdSocieties[1]._id,
        assetLibraryItemId: createdAssetLibraryItems[3]._id, // CCTV
        name: 'Main Gate Camera 1',
        location: {
          description: 'Main Entrance Gate'
        },
        serialNumber: 'HK-CAM-001',
        installationDate: new Date('2022-08-15'),
        condition: 'Excellent'
      },
      {
        societyId: createdSocieties[2]._id,
        assetLibraryItemId: createdAssetLibraryItems[4]._id, // HVAC
        name: 'Common Area AC System',
        location: {
          description: 'Community Hall'
        },
        serialNumber: 'DKN-VRV-RG-001',
        installationDate: new Date('2021-12-05'),
        condition: 'Good'
      }
    ];
    
    const createdAssets = [];
    for (const assetData of assetsData) {
      const asset = new Asset({
        ...assetData,
        adminId: adminUser._id
      });
      await asset.save();
      createdAssets.push(asset);
      console.log('✅ Asset created:', asset.name, '| ID:', asset._id);
    }
    
    // Create tasks
    console.log('📋 Creating tasks...');
    const tasksData = [
      {
        societyId: createdSocieties[0]._id,
        assignedManagerId: createdManagers[0]._id,
        assetId: createdAssets[0]._id,
        title: 'Monthly Elevator Maintenance',
        description: 'Regular maintenance check of all elevators in Tower A',
        priority: 'High',
        status: 'InProgress',
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        estimatedDuration: 120 // 2 hours
      },
      {
        societyId: createdSocieties[0]._id,
        assignedManagerId: createdManagers[0]._id,
        assetId: createdAssets[1]._id,
        title: 'Water Pump Inspection',
        description: 'Quarterly inspection and cleaning of water pump',
        priority: 'Medium',
        status: 'Pending',
        scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        estimatedDuration: 90
      },
      {
        societyId: createdSocieties[1]._id,
        assignedManagerId: createdManagers[1]._id,
        assetId: createdAssets[2]._id,
        title: 'Generator Load Testing',
        description: 'Monthly load test and fuel check for backup generator',
        priority: 'High',
        status: 'Pending',
        scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        estimatedDuration: 60
      },
      {
        societyId: createdSocieties[1]._id,
        assignedManagerId: createdManagers[1]._id,
        assetId: createdAssets[3]._id,
        title: 'CCTV System Check',
        description: 'Verify all CCTV cameras are working and recording properly',
        priority: 'Medium',
        status: 'Completed',
        scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        actualStartTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        actualEndTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        estimatedDuration: 45
      },
      {
        societyId: createdSocieties[2]._id,
        assignedManagerId: createdManagers[2]._id,
        assetId: createdAssets[4]._id,
        title: 'AC Filter Replacement',
        description: 'Replace air filters in community hall HVAC system',
        priority: 'Low',
        status: 'InProgress',
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        estimatedDuration: 30
      },
      {
        societyId: createdSocieties[0]._id,
        assignedManagerId: createdManagers[0]._id,
        assetId: createdAssets[0]._id,
        title: 'Common Area Painting',
        description: 'Repaint common corridors and stairways in Tower A',
        priority: 'Low',
        status: 'Pending',
        scheduledDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        estimatedDuration: 480 // 8 hours
      },
      {
        societyId: createdSocieties[1]._id,
        assignedManagerId: createdManagers[1]._id,
        assetId: createdAssets[2]._id,
        title: 'Fix Water Leakage - Basement',
        description: 'Urgent: Water leakage detected in basement parking area',
        priority: 'Critical',
        status: 'InProgress',
        scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        estimatedDuration: 180 // 3 hours
      },
      {
        societyId: createdSocieties[2]._id,
        assignedManagerId: createdManagers[2]._id,
        assetId: createdAssets[4]._id,
        title: 'Garden Landscaping',
        description: 'Trim bushes and plant new flowers in main garden area',
        priority: 'Low',
        status: 'Pending',
        scheduledDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        estimatedDuration: 240 // 4 hours
      }
    ];
    
    const createdTasks = [];
    for (const taskData of tasksData) {
      const task = new Task({
        ...taskData,
        adminId: adminUser._id
      });
      await task.save();
      createdTasks.push(task);
      console.log('✅ Task created:', task.title, '| Priority:', task.priority, '| Status:', task.status);
    }
    
    console.log('\n✨ Database reset and seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@maintainly.com / admin123');
    console.log('   Manager: manager@maintainly.com / manager123');
    console.log('\n📊 Summary:');
    console.log('   - Admin ID:', adminUser._id);
    console.log('   - Managers:', createdManagers.length);
    console.log('   - Societies:', createdSocieties.length);
    console.log('   - Assets:', createdAssets.length);
    console.log('   - Asset Library Items:', createdAssetLibraryItems.length);
    console.log('   - Tasks:', createdTasks.length);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

resetDatabase();
