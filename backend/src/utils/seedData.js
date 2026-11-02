const mongoose = require('mongoose');
const User = require('../models/User');
const Franchise = require('../models/Franchise');

const seedDatabase = async () => {
  console.log('🌱 Seeding FranchiseDunia database...');

  // Clear existing collections
  await User.deleteMany({});
  await Franchise.deleteMany({});

  // 1. Create Demo Users
  const users = [
    {
      name: 'Aditya Birla (Investor)',
      email: 'demo_investor@franchisedunia.in',
      password: 'Password123!',
      role: 'investor',
      phone: '+91 98201 12345',
      city: 'Mumbai',
      company: 'Apex Angels Capital',
      isVerified: true,
    },
    {
      name: 'Vikram Oberoi (Brand Owner)',
      email: 'demo_brand_owner@franchisedunia.in',
      password: 'Password123!',
      role: 'brand_owner',
      phone: '+91 98111 67890',
      city: 'Delhi NCR',
      company: 'Chai Point Franchising Ltd',
      isVerified: true,
    },
    {
      name: 'Rajesh Mehra (Brand Partner B)',
      email: 'brand_partner@franchisedunia.in',
      password: 'Password123!',
      role: 'brand_owner',
      phone: '+91 98333 44556',
      city: 'Bengaluru',
      company: 'Wow! Momo Retail Ventures',
      isVerified: true,
    },
    {
      name: 'Pooja Singhania (Business Seller)',
      email: 'demo_business_seller@franchisedunia.in',
      password: 'Password123!',
      role: 'business_seller',
      phone: '+91 98450 99887',
      city: 'Bengaluru',
      company: 'Cloud Kitchens India Pvt Ltd',
      isVerified: true,
    },
    {
      name: 'Sameer Sen (Event Organizer)',
      email: 'demo_event_organizer@franchisedunia.in',
      password: 'Password123!',
      role: 'event_organizer',
      phone: '+91 98710 55443',
      city: 'Mumbai',
      company: 'Franchise Expo India Exhibitions',
      isVerified: true,
    },
    // Admin is ONLY created via seed script
    {
      name: 'Platform Administrator',
      email: 'admin@franchisedunia.in',
      password: 'AdminSecure2025!',
      role: 'admin',
      phone: '+91 99999 00000',
      city: 'Mumbai',
      company: 'FranchiseDunia HQ',
      isVerified: true,
    },
  ];

  const createdUsers = [];
  for (const u of users) {
    const userDoc = new User(u);
    await userDoc.save();
    createdUsers.push(userDoc);
  }

  const brandOwnerA = createdUsers.find((u) => u.email === 'demo_brand_owner@franchisedunia.in');
  const brandOwnerB = createdUsers.find((u) => u.email === 'brand_partner@franchisedunia.in');

  console.log(`✅ Seeded ${createdUsers.length} initial accounts (Investor, Brand Owners, Seller, Event Organizer, Admin).`);

  // 2. Comprehensive 26+ Franchises across 8 Core Industries
  const franchisesData = [
    // --- 1. Food & Beverage (F&B) ---
    {
      name: 'Chai Point',
      slug: 'chai-point',
      tagline: 'India’s Largest Fresh Tea & Snack Experience Platform',
      industry: 'Food & Beverage',
      brandOwner: brandOwnerA._id,
      investmentMin: 1800000, // ₹18 Lakhs
      investmentMax: 3500000, // ₹35 Lakhs
      franchiseFee: 400000,
      royaltyPercent: 6,
      spaceMinSqFt: 250,
      spaceMaxSqFt: 600,
      roiPeriodMonths: 14,
      unitsOperational: 180,
      headquarters: 'Bengaluru, Karnataka',
      availableLocations: ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Pune'],
      establishedYear: 2010,
      description:
        'Chai Point revolutionizes India’s favorite beverage with IoT-enabled brewing technology, organic Assam garden teas, and premium snack offerings tailored for corporate hubs and high-street locations.',
      supportProvided: [
        'Proprietary IoT Dispenser & Tech Stack',
        'End-to-End Kitchen Layout & Architecture Design',
        'Pre-Opening Training for Store Managers & Baristas',
        'Central Warehouse Inventory Supply Chain',
        'Swiggy / Zomato Growth Algorithm Optimization',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 750000,
        expectedNetProfitMargin: 24,
        paybackPeriodMonths: 14,
        breakEvenPeriodMonths: 4,
      },
      logoUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'Wow! Momo & Wow! China',
      slug: 'wow-momo-china',
      tagline: 'Quick Service Restaurant Sensation Across India',
      industry: 'Food & Beverage',
      brandOwner: brandOwnerB._id,
      investmentMin: 1500000, // ₹15 Lakhs
      investmentMax: 2800000, // ₹28 Lakhs
      franchiseFee: 350000,
      royaltyPercent: 5,
      spaceMinSqFt: 180,
      spaceMaxSqFt: 450,
      roiPeriodMonths: 12,
      unitsOperational: 650,
      headquarters: 'Kolkata, West Bengal',
      availableLocations: ['Pan-India', 'Kolkata', 'Delhi NCR', 'Mumbai', 'Chennai'],
      establishedYear: 2008,
      description:
        'With over 600 outlets across 30+ cities, Wow! Momo is one of India’s most profitable and rapidly expanding QSR chains delivering innovative momo burgers, steamed delights, and sizzlers.',
      supportProvided: [
        'Central Frozen Logistics & Cold Chain Supply',
        'Comprehensive QSR SOPs & POS Integration',
        'Celebrity Endorsements & Digital Marketing Campaigns',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 600000,
        expectedNetProfitMargin: 26,
        paybackPeriodMonths: 12,
        breakEvenPeriodMonths: 3,
      },
      logoUrl: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'The Belgian Waffle Co.',
      slug: 'the-belgian-waffle-co',
      tagline: 'India’s Leading Waffle Specialty Chain',
      industry: 'Food & Beverage',
      brandOwner: brandOwnerA._id,
      investmentMin: 1200000, // ₹12 Lakhs
      investmentMax: 2000000, // ₹20 Lakhs
      franchiseFee: 300000,
      royaltyPercent: 8,
      spaceMinSqFt: 150,
      spaceMaxSqFt: 300,
      roiPeriodMonths: 10,
      unitsOperational: 450,
      headquarters: 'Mumbai, Maharashtra',
      availableLocations: ['Pan-India', 'Mumbai', 'Pune', 'Bengaluru', 'Ahmedabad'],
      establishedYear: 2015,
      description:
        'Pioneer of the on-the-go waffle concept with 450+ outlets across 160+ cities. High gross margins with low capex and rapid footfall turnaround.',
      supportProvided: [
        'Compact Kitchen Blueprint & Equipment Spec',
        'Continuous Product Innovation & Festive Specials',
        'National Brand Tie-ups & Influencer Marketing',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 450000,
        expectedNetProfitMargin: 30,
        paybackPeriodMonths: 10,
        breakEvenPeriodMonths: 3,
      },
      logoUrl: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1568051243851-f9b136146e97?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },
    {
      name: 'Biryani Blues',
      slug: 'biryani-blues',
      tagline: 'Authentic Hyderabadi Dum Biryani Delivery & Dine-In',
      industry: 'Food & Beverage',
      brandOwner: brandOwnerB._id,
      investmentMin: 2500000, // ₹25 Lakhs
      investmentMax: 4500000, // ₹45 Lakhs
      franchiseFee: 500000,
      royaltyPercent: 6,
      spaceMinSqFt: 400,
      spaceMaxSqFt: 1000,
      roiPeriodMonths: 16,
      unitsOperational: 80,
      headquarters: 'Gurugram, Haryana',
      availableLocations: ['Delhi NCR', 'Chandigarh', 'Jaipur', 'Lucknow'],
      establishedYear: 2013,
      description:
        'Award-winning biryani chain delivering authentic Hyderabadi handi biryani. Optimized dual model capturing high-ticket dine-in and heavy online delivery orders.',
      supportProvided: [
        'Central Pre-Marinated Spice Supply',
        'Automated Precision Kitchen Operations',
        'Staff Recruitment & Onboarding',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 1100000,
        expectedNetProfitMargin: 22,
        paybackPeriodMonths: 16,
        breakEvenPeriodMonths: 5,
      },
      logoUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },

    // --- 2. Healthcare ---
    {
      name: 'Dr. Lal PathLabs',
      slug: 'dr-lal-pathlabs',
      tagline: 'India’s Most Trusted Diagnostics Network',
      industry: 'Healthcare',
      brandOwner: brandOwnerA._id,
      investmentMin: 500000, // ₹5 Lakhs
      investmentMax: 1200000, // ₹12 Lakhs
      franchiseFee: 150000,
      royaltyPercent: 0,
      spaceMinSqFt: 150,
      spaceMaxSqFt: 350,
      roiPeriodMonths: 9,
      unitsOperational: 4500,
      headquarters: 'New Delhi',
      availableLocations: ['Pan-India', 'Mumbai', 'Delhi NCR', 'Kolkata', 'Hyderabad'],
      establishedYear: 1949,
      description:
        'Patient Collection Center (PSC) franchise model with zero technical lab machinery needed on-site. Samples are picked up by central temperature-controlled logistics for analysis in NABL-accredited labs.',
      supportProvided: [
        'Barcoded Sample Collection Kits',
        'LIMS Software & Doctor CRM Access',
        'Local Doctor CNE Workshops & Marketing Collateral',
        'Daily Temperature-Controlled Sample Pickups',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 350000,
        expectedNetProfitMargin: 35,
        paybackPeriodMonths: 9,
        breakEvenPeriodMonths: 2,
      },
      logoUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'Apollo Pharmacy & Diagnostics',
      slug: 'apollo-pharmacy-diagnostics',
      tagline: 'Healthcare at Your Doorstep',
      industry: 'Healthcare',
      brandOwner: brandOwnerA._id,
      investmentMin: 1500000, // ₹15 Lakhs
      investmentMax: 3000000, // ₹30 Lakhs
      franchiseFee: 250000,
      royaltyPercent: 4,
      spaceMinSqFt: 300,
      spaceMaxSqFt: 800,
      roiPeriodMonths: 15,
      unitsOperational: 5000,
      headquarters: 'Chennai, Tamil Nadu',
      availableLocations: ['Pan-India', 'Chennai', 'Bengaluru', 'Hyderabad', 'Kochi'],
      establishedYear: 1983,
      description:
        'Combining retail pharmacy sales, chronic disease medicine subscriptions, and diagnostic blood collection under the legendary Apollo Hospitals brand banner.',
      supportProvided: [
        'Complete Pharma Inventory & ERP Sync',
        'Pharmacist Staff Sourcing Assistance',
        '24/7 Digital Prescription Verification Support',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 900000,
        expectedNetProfitMargin: 19,
        paybackPeriodMonths: 15,
        breakEvenPeriodMonths: 4,
      },
      logoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },
    {
      name: 'Clove Dental Clinics',
      slug: 'clove-dental-clinics',
      tagline: 'India’s Largest Dental Healthcare Network',
      industry: 'Healthcare',
      brandOwner: brandOwnerB._id,
      investmentMin: 2800000, // ₹28 Lakhs
      investmentMax: 4800000, // ₹48 Lakhs
      franchiseFee: 500000,
      royaltyPercent: 7,
      spaceMinSqFt: 500,
      spaceMaxSqFt: 900,
      roiPeriodMonths: 18,
      unitsOperational: 380,
      headquarters: 'New Delhi',
      availableLocations: ['Delhi NCR', 'Mumbai', 'Bengaluru', 'Pune', 'Hyderabad'],
      establishedYear: 2011,
      description:
        'State-of-the-art multi-chair dental clinics powered by 10x sterilization protocols, cutting-edge imaging equipment, and centralized dentist rosters.',
      supportProvided: [
        'German Dental Chair Setup & Autoclave Suite',
        'Dentist Recruitment & Clinical Quality Audits',
        'Central Patient Call-Center & Appointment Booking',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 700000,
        expectedNetProfitMargin: 28,
        paybackPeriodMonths: 18,
        breakEvenPeriodMonths: 6,
      },
      logoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },

    // --- 3. Retail ---
    {
      name: 'Lenskart Store',
      slug: 'lenskart-store',
      tagline: 'Omnichannel Eyewear Revolution',
      industry: 'Retail',
      brandOwner: brandOwnerA._id,
      investmentMin: 3000000, // ₹30 Lakhs
      investmentMax: 4500000, // ₹45 Lakhs
      franchiseFee: 400000,
      royaltyPercent: 0, // FOCO model with margin share
      spaceMinSqFt: 350,
      spaceMaxSqFt: 750,
      roiPeriodMonths: 16,
      unitsOperational: 2000,
      headquarters: 'Faridabad, Haryana',
      availableLocations: ['Pan-India', 'Tier 1', 'Tier 2', 'Tier 3'],
      establishedYear: 2010,
      description:
        'Lenskart operates India’s foremost eyewear retail franchise using an AI-backed digital eye checkup station and robotic automated lens edging plant to deliver unmatched customer retention.',
      supportProvided: [
        '3D Try-On Machine & Optometrist Gear',
        'Zero Inventory Risk (Company-Owned Stock Model)',
        'Celebrity Brand Ambassador Campaigns',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 1200000,
        expectedNetProfitMargin: 25,
        paybackPeriodMonths: 16,
        breakEvenPeriodMonths: 4,
      },
      logoUrl: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'Miniso Lifestyle Store',
      slug: 'miniso-lifestyle-store',
      tagline: 'Fast Fashion & Aesthetic Home Essentials',
      industry: 'Retail',
      brandOwner: brandOwnerB._id,
      investmentMin: 5000000, // ₹50 Lakhs
      investmentMax: 8500000, // ₹85 Lakhs
      franchiseFee: 800000,
      royaltyPercent: 5,
      spaceMinSqFt: 1000,
      spaceMaxSqFt: 2500,
      roiPeriodMonths: 20,
      unitsOperational: 220,
      headquarters: 'Gurugram, Haryana',
      availableLocations: ['Mumbai', 'Delhi NCR', 'Bengaluru', 'Ahmedabad', 'Chandigarh'],
      establishedYear: 2013,
      description:
        'Global designer lifestyle brand offering aesthetic beauty, home decor, electronics, and licensed IP toys (Marvel, Sanrio, Disney) at budget prices.',
      supportProvided: [
        'Turnkey Visual Merchandising & Fixtures',
        'Bi-Weekly International SKU Refreshes',
        'Retail ERP & Automated Stock Replenishment',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 2200000,
        expectedNetProfitMargin: 20,
        paybackPeriodMonths: 20,
        breakEvenPeriodMonths: 5,
      },
      logoUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },
    {
      name: 'FirstCry Stores',
      slug: 'firstcry-stores',
      tagline: 'Asia’s Largest Baby & Kids Store',
      industry: 'Retail',
      brandOwner: brandOwnerA._id,
      investmentMin: 4000000, // ₹40 Lakhs
      investmentMax: 6500000, // ₹65 Lakhs
      franchiseFee: 500000,
      royaltyPercent: 4,
      spaceMinSqFt: 800,
      spaceMaxSqFt: 1800,
      roiPeriodMonths: 18,
      unitsOperational: 950,
      headquarters: 'Pune, Maharashtra',
      availableLocations: ['Pan-India', 'Pune', 'Mumbai', 'Nagpur', 'Indore'],
      establishedYear: 2010,
      description:
        'Unmatched brand recall in mother and baby care, apparel, footwear, nursery furniture, and toys with strong omnichannel click-and-collect synergies.',
      supportProvided: [
        'Store Design & Visual Shelving Blueprint',
        'Access to 2,000+ Domestic and Global Kids Brands',
        'Hyperlocal Digital Parent Marketing Campaigns',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 1500000,
        expectedNetProfitMargin: 21,
        paybackPeriodMonths: 18,
        breakEvenPeriodMonths: 4,
      },
      logoUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },

    // --- 4. Education ---
    {
      name: 'Kidzee Preschool & Daycare',
      slug: 'kidzee-preschool-daycare',
      tagline: 'Pioneers in Early Childhood Care and Education in India',
      industry: 'Education',
      brandOwner: brandOwnerA._id,
      investmentMin: 1200000, // ₹12 Lakhs
      investmentMax: 2200000, // ₹22 Lakhs
      franchiseFee: 250000,
      royaltyPercent: 12,
      spaceMinSqFt: 1500,
      spaceMaxSqFt: 3000,
      roiPeriodMonths: 14,
      unitsOperational: 2000,
      headquarters: 'Mumbai, Maharashtra',
      availableLocations: ['Pan-India', 'Mumbai', 'Delhi NCR', 'Jaipur', 'Lucknow'],
      establishedYear: 2003,
      description:
        'With over 2,000 centers across 750+ cities, Kidzee has nurtured over a million children through its proprietary iLLUME curriculum focusing on multiple intelligences.',
      supportProvided: [
        'Proprietary iLLUME Teaching Kits & Books',
        'Teacher Recruitment Guidelines & Periodic Certifications',
        'Local Parent Admission Campaign Playbook',
        'Academic Audits & Center Management Portal',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 400000,
        expectedNetProfitMargin: 35,
        paybackPeriodMonths: 14,
        breakEvenPeriodMonths: 4,
      },
      logoUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'Allen Career Institute Center',
      slug: 'allen-career-institute',
      tagline: 'The Gold Standard in JEE & NEET Coaching',
      industry: 'Education',
      brandOwner: brandOwnerB._id,
      investmentMin: 6000000, // ₹60 Lakhs
      investmentMax: 12000000, // ₹1.2 Crores
      franchiseFee: 1500000,
      royaltyPercent: 15,
      spaceMinSqFt: 3500,
      spaceMaxSqFt: 7000,
      roiPeriodMonths: 20,
      unitsOperational: 240,
      headquarters: 'Kota, Rajasthan',
      availableLocations: ['Tier 2 Cities', 'Patna', 'Bhopal', 'Varanasi', 'Ranchi'],
      establishedYear: 1988,
      description:
        'Represents the undisputed leader in entrance preparation across STEM fields. Allen centers capture top regional student cohorts with superior fee realization.',
      supportProvided: [
        'Kota Study Modules, Test Series, and Mock Papers',
        'Faculty Training & Video Lecture Library',
        'Pan-India Tallentex Scholarship Engine',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 3000000,
        expectedNetProfitMargin: 30,
        paybackPeriodMonths: 20,
        breakEvenPeriodMonths: 6,
      },
      logoUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },
    {
      name: 'Aptech Learning & Arena Animation',
      slug: 'aptech-arena-animation',
      tagline: 'Leading Global Career Education & VFX Academy',
      industry: 'Education',
      brandOwner: brandOwnerA._id,
      investmentMin: 2000000, // ₹20 Lakhs
      investmentMax: 3500000, // ₹35 Lakhs
      franchiseFee: 400000,
      royaltyPercent: 15,
      spaceMinSqFt: 1200,
      spaceMaxSqFt: 2500,
      roiPeriodMonths: 15,
      unitsOperational: 1400,
      headquarters: 'Mumbai, Maharashtra',
      availableLocations: ['Pan-India', 'Mumbai', 'Chennai', 'Kolkata', 'Hyderabad'],
      establishedYear: 1986,
      description:
        'Industry leader in digital media, UI/UX, gaming, animation, and software engineering certification courses with high student placement percentages.',
      supportProvided: [
        'Curriculum Licensing & Autodesk / Adobe Partnerships',
        'Central Student Placement Cell with Top Studios',
        'Digital LMS with 24/7 Practice Modules',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 650000,
        expectedNetProfitMargin: 32,
        paybackPeriodMonths: 15,
        breakEvenPeriodMonths: 4,
      },
      logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },

    // --- 5. Fitness & Wellness ---
    {
      name: 'Cult.fit Gym & Fitness Studio',
      slug: 'cult-fit-studio',
      tagline: 'Making Fitness Fun, Easy, and Everyday',
      industry: 'Fitness & Wellness',
      brandOwner: brandOwnerA._id,
      investmentMin: 5500000, // ₹55 Lakhs
      investmentMax: 11000000, // ₹1.1 Crores
      franchiseFee: 1000000,
      royaltyPercent: 8,
      spaceMinSqFt: 2500,
      spaceMaxSqFt: 5000,
      roiPeriodMonths: 18,
      unitsOperational: 600,
      headquarters: 'Bengaluru, Karnataka',
      availableLocations: ['Pan-India', 'Bengaluru', 'Delhi NCR', 'Mumbai', 'Hyderabad'],
      establishedYear: 2016,
      description:
        'India’s most recognizable fitness phenomenon offering trainer-led group fitness classes (Boxing, HIIT, Yoga, Dance Fitness) and smart open gyms via the Cult app.',
      supportProvided: [
        'Cult App Member Integration (Instant Subscriber Base)',
        'Bio-Mechanics Equipment Sourcing at Bulk Discounts',
        'Master Trainer Certifications & Daily Class Playlists',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 1800000,
        expectedNetProfitMargin: 27,
        paybackPeriodMonths: 18,
        breakEvenPeriodMonths: 5,
      },
      logoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'Naturals Salon & Spa',
      slug: 'naturals-salon-spa',
      tagline: 'India’s No. 1 Unisex Salon Brand',
      industry: 'Fitness & Wellness',
      brandOwner: brandOwnerB._id,
      investmentMin: 3000000, // ₹30 Lakhs
      investmentMax: 5000000, // ₹50 Lakhs
      franchiseFee: 500000,
      royaltyPercent: 10,
      spaceMinSqFt: 800,
      spaceMaxSqFt: 1500,
      roiPeriodMonths: 16,
      unitsOperational: 700,
      headquarters: 'Chennai, Tamil Nadu',
      availableLocations: ['Pan-India', 'Chennai', 'Bengaluru', 'Coimbatore', 'Hyderabad'],
      establishedYear: 2000,
      description:
        'Over 700 successful salons operating across India. Highly profitable salon chain serving men, women, and bridal makeovers with trusted professional stylists.',
      supportProvided: [
        'Salon Stylist Academy & Recruitment Pipeline',
        'L’Oreal & Schwarzkopf Direct Supply Partnerships',
        'CRM with Automatic Repeat Booking Triggers',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 850000,
        expectedNetProfitMargin: 26,
        paybackPeriodMonths: 16,
        breakEvenPeriodMonths: 4,
      },
      logoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },
    {
      name: 'Jawed Habib Hair & Beauty Lounge',
      slug: 'jawed-habib-lounge',
      tagline: 'Iconic Hair Styling and Grooming Excellence',
      industry: 'Fitness & Wellness',
      brandOwner: brandOwnerA._id,
      investmentMin: 2000000, // ₹20 Lakhs
      investmentMax: 3500000, // ₹35 Lakhs
      franchiseFee: 350000,
      royaltyPercent: 8,
      spaceMinSqFt: 500,
      spaceMaxSqFt: 1200,
      roiPeriodMonths: 14,
      unitsOperational: 900,
      headquarters: 'Mumbai, Maharashtra',
      availableLocations: ['Pan-India', 'Mumbai', 'Pune', 'Surat', 'Nagpur'],
      establishedYear: 2006,
      description:
        'Celebrity hair stylist brand with a mass-market footprint. Delivers high margins through precision haircuts, hair spa, color treatments, and retail beauty products.',
      supportProvided: [
        'Habib Academy Certified Hairdressers',
        'Branded Product Supply with 40% Retailing Margin',
        'National Festival Discount Engine',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 600000,
        expectedNetProfitMargin: 28,
        paybackPeriodMonths: 14,
        breakEvenPeriodMonths: 3,
      },
      logoUrl: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },

    // --- 6. Logistics & Supply Chain ---
    {
      name: 'DTDC Express Franchise',
      slug: 'dtdc-express',
      tagline: 'Connecting India to the World with Reliable Logistics',
      industry: 'Logistics & Supply Chain',
      brandOwner: brandOwnerA._id,
      investmentMin: 150000, // ₹1.5 Lakhs (Micro-franchise)
      investmentMax: 500000, // ₹5 Lakhs
      franchiseFee: 50000,
      royaltyPercent: 0, // Commission margin structure
      spaceMinSqFt: 100,
      spaceMaxSqFt: 300,
      roiPeriodMonths: 6,
      unitsOperational: 12000,
      headquarters: 'Bengaluru, Karnataka',
      availableLocations: ['Pan-India', 'Mumbai', 'Delhi NCR', 'Kolkata', 'Chennai', 'Bengaluru'],
      establishedYear: 1990,
      description:
        'India’s pioneer logistics franchise model with over 12,000 channel partners. High transaction velocity from e-commerce returns, corporate courier accounts, and international freight.',
      supportProvided: [
        'DTDC Barcode Scanner & Digital Weighing Scale',
        'Franchisee Booking Portal & Cloud Tracking',
        'Daily Regional Hub Vehicle Pickups',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 250000,
        expectedNetProfitMargin: 40,
        paybackPeriodMonths: 6,
        breakEvenPeriodMonths: 1,
      },
      logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'Delhivery Express Parcel Hub',
      slug: 'delhivery-parcel-hub',
      tagline: 'Next-Gen Automated Supply Chain Infrastructure',
      industry: 'Logistics & Supply Chain',
      brandOwner: brandOwnerB._id,
      investmentMin: 600000, // ₹6 Lakhs
      investmentMax: 1500000, // ₹15 Lakhs
      franchiseFee: 100000,
      royaltyPercent: 0,
      spaceMinSqFt: 400,
      spaceMaxSqFt: 1000,
      roiPeriodMonths: 10,
      unitsOperational: 4000,
      headquarters: 'Gurugram, Haryana',
      availableLocations: ['Pan-India', 'Tier 2', 'Tier 3', 'Metro Outskirts'],
      establishedYear: 2011,
      description:
        'Deliver millions of e-commerce packages (Amazon, Flipkart, Meesho, Myntra) directly in your pincode area with guaranteed daily dispatch volumes.',
      supportProvided: [
        'Automated Dispatch Route Planner App',
        'Fleet Management & Fuel Discount Cards',
        'Dedicated Territory Exclusivity',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 450000,
        expectedNetProfitMargin: 25,
        paybackPeriodMonths: 10,
        breakEvenPeriodMonths: 2,
      },
      logoUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },
    {
      name: 'Shadowfax Express Partner',
      slug: 'shadowfax-express-partner',
      tagline: 'Hyperlocal & Same-Day Delivery Super Hub',
      industry: 'Logistics & Supply Chain',
      brandOwner: brandOwnerA._id,
      investmentMin: 400000, // ₹4 Lakhs
      investmentMax: 900000, // ₹9 Lakhs
      franchiseFee: 75000,
      royaltyPercent: 0,
      spaceMinSqFt: 250,
      spaceMaxSqFt: 600,
      roiPeriodMonths: 8,
      unitsOperational: 2500,
      headquarters: 'Bengaluru, Karnataka',
      availableLocations: ['Pan-India', 'Bengaluru', 'Hyderabad', 'Mumbai', 'Pune'],
      establishedYear: 2015,
      description:
        'Crowdsourced logistics partner for quick-commerce and instant deliveries (Zepto, Blinkit, Swiggy Instamart) with steady weekly payout cycles.',
      supportProvided: [
        'Real-time Rider Telematics Dashboard',
        'Pincode Exclusivity & Bulk E-Commerce Inflow',
        'Payout Guarantee Protocols',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 320000,
        expectedNetProfitMargin: 30,
        paybackPeriodMonths: 8,
        breakEvenPeriodMonths: 2,
      },
      logoUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },

    // --- 7. Technology ---
    {
      name: 'Cashify Smart Store',
      slug: 'cashify-smart-store',
      tagline: 'Buy, Sell, and Repair Gadgets Under One Roof',
      industry: 'Technology',
      brandOwner: brandOwnerA._id,
      investmentMin: 2200000, // ₹22 Lakhs
      investmentMax: 3800000, // ₹38 Lakhs
      franchiseFee: 300000,
      royaltyPercent: 5,
      spaceMinSqFt: 200,
      spaceMaxSqFt: 500,
      roiPeriodMonths: 12,
      unitsOperational: 250,
      headquarters: 'Gurugram, Haryana',
      availableLocations: ['Pan-India', 'Delhi NCR', 'Mumbai', 'Bengaluru', 'Chandigarh'],
      establishedYear: 2013,
      description:
        'High-footfall tech retail franchise where customers sell old phones with instant cash, purchase refurbished Apple & Android smartphones with warranty, and get instant screen repairs.',
      supportProvided: [
        'Automated Phone Diagnostic Hardware Tool',
        'Certified Technician Training Curriculum',
        'Continuous Stock Supply of Refurbished Grade-A Devices',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 950000,
        expectedNetProfitMargin: 22,
        paybackPeriodMonths: 12,
        breakEvenPeriodMonths: 3,
      },
      logoUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'Robokids AI & Robotics Academy',
      slug: 'robokids-ai-robotics',
      tagline: 'Hands-on Coding, Drones & AI Engineering for K-12',
      industry: 'Technology',
      brandOwner: brandOwnerB._id,
      investmentMin: 1400000, // ₹14 Lakhs
      investmentMax: 2400000, // ₹24 Lakhs
      franchiseFee: 250000,
      royaltyPercent: 10,
      spaceMinSqFt: 600,
      spaceMaxSqFt: 1200,
      roiPeriodMonths: 11,
      unitsOperational: 120,
      headquarters: 'Hyderabad, Telangana',
      availableLocations: ['Hyderabad', 'Bengaluru', 'Chennai', 'Pune', 'Mumbai'],
      establishedYear: 2018,
      description:
        'STEM academy introducing school students to Arduino, Raspberry Pi, Python robotics, and generative AI through playful competitions and project-based certifications.',
      supportProvided: [
        'Hardware Robotics DIY Kits & 3D Printers',
        'International Olympiad Registration Access',
        'Instructor Training & Lesson Slides',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 420000,
        expectedNetProfitMargin: 38,
        paybackPeriodMonths: 11,
        breakEvenPeriodMonths: 3,
      },
      logoUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },
    {
      name: 'IT Support Pro Express',
      slug: 'it-support-pro-express',
      tagline: 'Managed Cloud, Cyber & Hardware Solutions for SMEs',
      industry: 'Technology',
      brandOwner: brandOwnerA._id,
      investmentMin: 1800000, // ₹18 Lakhs
      investmentMax: 3000000, // ₹30 Lakhs
      franchiseFee: 300000,
      royaltyPercent: 8,
      spaceMinSqFt: 400,
      spaceMaxSqFt: 800,
      roiPeriodMonths: 13,
      unitsOperational: 75,
      headquarters: 'Noida, Uttar Pradesh',
      availableLocations: ['Pan-India', 'Delhi NCR', 'Mumbai', 'Ahmedabad', 'Bengaluru'],
      establishedYear: 2017,
      description:
        'B2B IT services franchise serving mid-sized enterprises with CCTV surveillance, firewall installation, cloud migration, and monthly AMC maintenance agreements.',
      supportProvided: [
        'Enterprise Vendor Distributorship Deals (Cisco, HP, Dell)',
        'B2B Lead Generation & Sales Pitch Kits',
        'Central NOC Helpdesk 24/7 Escalation',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 700000,
        expectedNetProfitMargin: 29,
        paybackPeriodMonths: 13,
        breakEvenPeriodMonths: 4,
      },
      logoUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },

    // --- 8. Automotive & Mobility ---
    {
      name: 'GoMechanic Smart Workshop',
      slug: 'gomechanic-smart-workshop',
      tagline: 'India’s Network of Tech-Enabled Multi-Brand Car Service Centers',
      industry: 'Automotive & Mobility',
      brandOwner: brandOwnerA._id,
      investmentMin: 3500000, // ₹35 Lakhs
      investmentMax: 6500000, // ₹65 Lakhs
      franchiseFee: 400000,
      royaltyPercent: 7,
      spaceMinSqFt: 2500,
      spaceMaxSqFt: 6000,
      roiPeriodMonths: 18,
      unitsOperational: 800,
      headquarters: 'Gurugram, Haryana',
      availableLocations: ['Pan-India', 'Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Pune'],
      establishedYear: 2016,
      description:
        'Tech-driven car workshop network offering periodic service, denting & painting, and AC repair at 40% lower costs than authorized OEM dealerships.',
      supportProvided: [
        'OEM-Grade Diagnostic Scanners & Hydraulic Lifts',
        'Central Spare Parts Catalog with Wholesale Rates',
        'Inbound App Customer Booking Guarantee',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 1400000,
        expectedNetProfitMargin: 25,
        paybackPeriodMonths: 18,
        breakEvenPeriodMonths: 5,
      },
      logoUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'Battery Smart EV Swapping Hub',
      slug: 'battery-smart-ev-hub',
      tagline: 'India’s Largest 2-Minute Battery Swapping Network for EVs',
      industry: 'Automotive & Mobility',
      brandOwner: brandOwnerB._id,
      investmentMin: 800000, // ₹8 Lakhs
      investmentMax: 1800000, // ₹18 Lakhs
      franchiseFee: 100000,
      royaltyPercent: 0, // Commission per swap
      spaceMinSqFt: 150,
      spaceMaxSqFt: 400,
      roiPeriodMonths: 9,
      unitsOperational: 1100,
      headquarters: 'New Delhi',
      availableLocations: ['Pan-India', 'Delhi NCR', 'Jaipur', 'Lucknow', 'Mumbai'],
      establishedYear: 2019,
      description:
        'Rapidly growing green energy franchise catering to electric 3-wheelers and 2-wheeler delivery riders with 2-minute battery swaps.',
      supportProvided: [
        'Automated Smart Battery Charging Towers',
        'Lithium-ion Battery Swapping Station Hardware',
        'Dedicated Commercial EV Driver Base',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 280000,
        expectedNetProfitMargin: 35,
        paybackPeriodMonths: 9,
        breakEvenPeriodMonths: 2,
      },
      logoUrl: 'https://images.unsplash.com/photo-1558441719-8b489c63f7d1?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },
    {
      name: 'Speed Car Wash & Detailing',
      slug: 'speed-car-wash',
      tagline: 'High-Pressure Automated Steam & Ceramic Coating Hub',
      industry: 'Automotive & Mobility',
      brandOwner: brandOwnerA._id,
      investmentMin: 1600000, // ₹16 Lakhs
      investmentMax: 2800000, // ₹28 Lakhs
      franchiseFee: 250000,
      royaltyPercent: 6,
      spaceMinSqFt: 1000,
      spaceMaxSqFt: 2000,
      roiPeriodMonths: 13,
      unitsOperational: 210,
      headquarters: 'Ludhiana, Punjab',
      availableLocations: ['Pan-India', 'Chandigarh', 'Ludhiana', 'Delhi NCR', 'Jaipur'],
      establishedYear: 2012,
      description:
        'Eco-friendly mechanised car wash franchise offering 20-minute washes, foam detailing, paint protection films (PPF), and ceramic coatings.',
      supportProvided: [
        'Italian High-Pressure Jet & Steam Machines',
        'Biodegradable Cleaning Chemicals & Shampoo Supply',
        'Customer Membership & Subscription Software',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 500000,
        expectedNetProfitMargin: 32,
        paybackPeriodMonths: 13,
        breakEvenPeriodMonths: 3,
      },
      logoUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=1200&auto=format&fit=crop&q=80',
      isFeatured: false,
      isVerified: true,
    },
    {
      name: 'Subway Fresh Forward',
      slug: 'subway-fresh-forward',
      tagline: 'The World’s Most Popular Fresh Sandwich Restaurant',
      industry: 'Food & Beverage',
      brandOwner: brandOwnerA._id,
      investmentMin: 3500000, // ₹35 Lakhs
      investmentMax: 5500000, // ₹55 Lakhs
      franchiseFee: 500000,
      royaltyPercent: 8,
      spaceMinSqFt: 350,
      spaceMaxSqFt: 800,
      roiPeriodMonths: 15,
      unitsOperational: 700,
      headquarters: 'Gurugram, Haryana',
      availableLocations: ['Pan-India', 'Mumbai', 'Delhi NCR', 'Bengaluru', 'Goa'],
      establishedYear: 1965,
      description:
        'Global icon in healthy fast food offering submarine sandwiches, wraps, and freshly baked cookies with the newly upgraded Fresh Forward digital aesthetic.',
      supportProvided: [
        'Global Equipment Standardization',
        'Subway University Online & In-Store Training',
        'International Supply Chain Quality Assurance',
      ],
      unitEconomics: {
        expectedMonthlyRevenue: 1300000,
        expectedNetProfitMargin: 22,
        paybackPeriodMonths: 15,
        breakEvenPeriodMonths: 4,
      },
      logoUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=200&auto=format&fit=crop&q=80',
      coverImageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1200&auto=format&fit=crop&q=80',
      isFeatured: true,
      isVerified: true,
    },
  ];

  const seededFranchises = await Franchise.insertMany(franchisesData);
  console.log(`✅ Seeded ${seededFranchises.length} realistic franchise opportunities across 8 industries.`);

  return { users: createdUsers, franchises: seededFranchises };
};

module.exports = seedDatabase;
