/**
 * Seed Script - Populate database with menu items from Haru Sora Café
 * Run with: node seedProducts.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sushi-cafe';

const menuItems = [
  // Sushi
  {
    name: 'Tuna Nigiri',
    description: 'Premium A-grade tuna slices on seasoned sushi rice. Simple, pristine, perfect.',
    price: 420,
    category: 'Sushi',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    tags: ["Chef's Pick", 'Premium'],
    isFeatured: true,
    preparationTime: 10,
    stock: 50
  },
  {
    name: 'Salmon Nigiri',
    description: 'Fresh Atlantic salmon on perfectly seasoned rice, served with wasabi and ginger.',
    price: 380,
    category: 'Sushi',
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80',
    tags: ['Popular'],
    preparationTime: 10,
    stock: 50
  },
  {
    name: 'Sashimi Platter',
    description: 'Assortment of sashimi selected by our chef — ideal for sharing.',
    price: 1150,
    category: 'Sushi',
    image: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=800&q=80',
    tags: ['Sharing', 'Premium'],
    isFeatured: true,
    preparationTime: 20,
    stock: 30
  },

  // Rolls
  {
    name: 'Dragon Roll',
    description: 'Eel, avocado, cucumber, topped with sweet glaze and sesame.',
    price: 520,
    category: 'Rolls',
    image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=800&q=80',
    tags: ['Popular', 'Signature'],
    isFeatured: true,
    preparationTime: 15,
    stock: 40
  },
  {
    name: 'Spicy Tuna Roll',
    description: 'Hand-rolled with chili mayo and scallions — a fan favourite.',
    price: 380,
    category: 'Rolls',
    image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=800&q=80',
    tags: ['Spicy', 'Popular'],
    isSpicy: true,
    preparationTime: 12,
    stock: 50
  },
  {
    name: 'Yasai Roll (Vegetarian)',
    description: 'Seasonal vegetables, avocado, and sesame — bright and fresh.',
    price: 320,
    category: 'Rolls',
    image: 'https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?auto=format&fit=crop&w=800&q=80',
    tags: ['Vegetarian', 'Healthy'],
    isVegetarian: true,
    preparationTime: 12,
    stock: 45
  },
  {
    name: 'Crunch Roll',
    description: 'Tempura crunch, cucumber, and house special sauce.',
    price: 390,
    category: 'Rolls',
    image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=800&q=80',
    tags: ['Crispy'],
    preparationTime: 15,
    stock: 40
  },
  {
    name: 'Rainbow Roll',
    description: 'California roll topped with assorted fresh fish and avocado slices.',
    price: 580,
    category: 'Rolls',
    image: 'https://images.unsplash.com/photo-1562967916-eb82221dfb44?auto=format&fit=crop&w=800&q=80',
    tags: ['Premium', 'Colorful'],
    isFeatured: true,
    preparationTime: 18,
    stock: 35
  },

  // Coffee
  {
    name: 'Cappuccino',
    description: 'Rich espresso balanced with silky steamed milk and microfoam.',
    price: 220,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    tags: ['Classic'],
    isVegetarian: true,
    preparationTime: 5,
    stock: 100
  },
  {
    name: 'Mocha Latte',
    description: 'Chocolatey, bittersweet, and smooth — a café classic.',
    price: 260,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=800&q=80',
    tags: ['Sweet', 'Popular'],
    isVegetarian: true,
    preparationTime: 5,
    stock: 100
  },
  {
    name: 'Matcha Latte',
    description: 'Stone-ground matcha whisked to order with steamed milk.',
    price: 240,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1523942839745-7848c839b661?auto=format&fit=crop&w=800&q=80',
    tags: ['Japanese', 'Healthy'],
    isVegetarian: true,
    isFeatured: true,
    preparationTime: 5,
    stock: 100
  },
  {
    name: 'Espresso',
    description: 'Strong, bold single shot of our house blend espresso.',
    price: 150,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=800&q=80',
    tags: ['Classic', 'Strong'],
    isVegetarian: true,
    preparationTime: 3,
    stock: 100
  },
  {
    name: 'Iced Caramel Latte',
    description: 'Smooth espresso with creamy milk and rich caramel over ice.',
    price: 280,
    category: 'Coffee',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
    tags: ['Iced', 'Sweet'],
    isVegetarian: true,
    preparationTime: 5,
    stock: 100
  },

  // Desserts
  {
    name: 'Sakura Mochi',
    description: 'Sweet rice cake wrapped in salted cherry leaf — seasonal favorite.',
    price: 150,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=80',
    tags: ['Japanese', 'Seasonal'],
    isVegetarian: true,
    isFeatured: true,
    preparationTime: 2,
    stock: 60
  },
  {
    name: 'Matcha Cheesecake',
    description: 'Creamy, slightly tangy cheesecake with matcha infusion.',
    price: 280,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1542827630-5b9b7b8b6b46?auto=format&fit=crop&w=800&q=80',
    tags: ['Japanese', 'Popular'],
    isVegetarian: true,
    preparationTime: 2,
    stock: 40
  },
  {
    name: 'Dorayaki',
    description: 'Traditional Japanese pancakes filled with sweet red bean paste.',
    price: 180,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1558954157-aa76c0d246c6?auto=format&fit=crop&w=800&q=80',
    tags: ['Japanese', 'Classic'],
    isVegetarian: true,
    preparationTime: 5,
    stock: 50
  },
  {
    name: 'Black Sesame Ice Cream',
    description: 'Unique nutty flavor with creamy texture, topped with sesame seeds.',
    price: 200,
    category: 'Desserts',
    image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=800&q=80',
    tags: ['Japanese', 'Unique'],
    isVegetarian: true,
    preparationTime: 2,
    stock: 45
  },

  // Drinks
  {
    name: 'Yuzu Lemonade',
    description: 'Refreshing citrus drink with Japanese yuzu and sparkling water.',
    price: 180,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=80',
    tags: ['Refreshing', 'Japanese'],
    isVegetarian: true,
    preparationTime: 3,
    stock: 80
  },
  {
    name: 'Japanese Green Tea',
    description: 'Premium sencha green tea, served hot or iced.',
    price: 120,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
    tags: ['Traditional', 'Healthy'],
    isVegetarian: true,
    preparationTime: 3,
    stock: 100
  },
  {
    name: 'Ramune Soda',
    description: 'Classic Japanese marble soda in original flavor.',
    price: 150,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=800&q=80',
    tags: ['Japanese', 'Fun'],
    isVegetarian: true,
    preparationTime: 1,
    stock: 60
  },

  // Specials
  {
    name: 'Omakase Box (Chef\'s Choice)',
    description: 'Let our chef surprise you with the freshest selections of the day. Includes 8 pieces of nigiri and a signature roll.',
    price: 1500,
    category: 'Specials',
    image: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?auto=format&fit=crop&w=800&q=80',
    tags: ["Chef's Special", 'Premium', 'Limited'],
    isFeatured: true,
    preparationTime: 25,
    stock: 20
  },
  {
    name: 'Weekend Brunch Set',
    description: 'Assorted sushi, miso soup, salad, and choice of coffee or matcha. Available Sat-Sun only.',
    price: 850,
    category: 'Specials',
    image: 'https://images.unsplash.com/photo-1540648639573-8c848de23f0a?auto=format&fit=crop&w=800&q=80',
    tags: ['Set Menu', 'Value'],
    preparationTime: 20,
    stock: 30
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing products
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing products');

    // Insert menu items
    const result = await Product.insertMany(menuItems);
    console.log(`✅ Inserted ${result.length} products`);

    // Show summary
    const categories = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Products by category:');
    categories.forEach(cat => {
      console.log(`   ${cat._id}: ${cat.count} items`);
    });

    const featured = await Product.countDocuments({ isFeatured: true });
    console.log(`\n⭐ Featured items: ${featured}`);

    console.log('\n✨ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedProducts();
