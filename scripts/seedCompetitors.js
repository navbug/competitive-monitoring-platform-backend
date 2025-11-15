require('dotenv').config();
const mongoose = require('mongoose');
const Competitor = require('../models/Competitor');

const projectManagementCompetitors = [
  {
    name: "Trello",
    website: "https://trello.com",
    industry: "Project Management SaaS",
    description: "Visual collaboration tool that creates a shared perspective on any project. Trello uses boards, lists, and cards to organize and prioritize projects.",
    monitoredChannels: {
      websitePages: [
        { 
          url: "https://trello.com/pricing", 
          type: "pricing",
          lastChecked: null
        },
        {
          url: "https://trello.com/enterprise",
          type: "product",
          lastChecked: null
        }
      ],
      rssFeeds: [
        { 
          // url: "https://blog.trello.com/feed",
          url: "https://rss.app/feeds/rKLWCV73uLNb3cE8.xml",
          lastChecked: null
        }
      ]
    },
    monitoringConfig: {
      enabled: true,
      frequency: "30minutes", // Fast testing!
      priority: "high"
    },
    tags: ["kanban", "visual", "collaboration", "boards"],
    status: "active"
  },
  // {
  //   name: "Asana",
  //   website: "https://asana.com",
  //   industry: "Project Management SaaS",
  //   description: "Work management platform helping teams orchestrate their work, from daily tasks to strategic initiatives. Track work from start to finish.",
  //   monitoredChannels: {
  //     websitePages: [
  //       { 
  //         url: "https://asana.com/pricing", 
  //         type: "pricing",
  //         lastChecked: null
  //       },
  //       {
  //         url: "https://asana.com/product",
  //         type: "product",
  //         lastChecked: null
  //       }
  //     ],
  //     rssFeeds: [
  //       { 
  //         url: "https://blog.asana.com/feed/",
  //         lastChecked: null
  //       }
  //     ]
  //   },
  //   monitoringConfig: {
  //     enabled: true,
  //     frequency: "6hours",
  //     priority: "high"
  //   },
  //   tags: ["tasks", "workflows", "teams", "automation"],
  //   status: "active"
  // },
  {
    name: "Monday.com",
    website: "https://monday.com",
    industry: "Project Management SaaS",
    description: "Work operating system that powers teams to run projects and workflows with confidence. Customizable platform for any workflow.",
    monitoredChannels: {
      websitePages: [
        { 
          url: "https://monday.com/pricing", 
          type: "pricing",
          lastChecked: null
        },
        {
          url: "https://monday.com/product",
          type: "product",
          lastChecked: null
        }
      ],
      rssFeeds: [
        { 
          // url: "https://monday.com/blog/feed/",
          url: "https://rss.app/feeds/Zh4l4dGZ8UKyhkSi.xml",
          lastChecked: null
        }
      ]
    },
    monitoringConfig: {
      enabled: true,
      frequency: "30minutes",
      priority: "high"
    },
    tags: ["customizable", "workflows", "work-os", "visual"],
    status: "active"
  },
  {
    name: "ClickUp",
    website: "https://clickup.com",
    industry: "Project Management SaaS",
    description: "All-in-one project management platform. One app to replace them all. Tasks, Docs, Goals, and Chat in one place.",
    monitoredChannels: {
      websitePages: [
        { 
          url: "https://clickup.com/pricing", 
          type: "pricing",
          lastChecked: null
        },
        {
          url: "https://clickup.com/features",
          type: "product",
          lastChecked: null
        }
      ],
      rssFeeds: [
        { 
          // url: "https://clickup.com/blog/feed/",
          url: "https://rss.app/feeds/WQtjKWMlbXGRd2f8.xml",
          lastChecked: null
        }
      ]
    },
    monitoringConfig: {
      enabled: true,
      frequency: "30minutes",
      priority: "high"
    },
    tags: ["all-in-one", "productivity", "customizable", "features"],
    status: "active"
  }
];

async function seedCompetitors() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing competitors
    console.log('🗑️  Clearing existing competitors...');
    await Competitor.deleteMany({});

    // Insert new competitors
    console.log('📝 Inserting Project Management SaaS competitors...');
    const inserted = await Competitor.insertMany(projectManagementCompetitors);

    console.log('\n✅ Successfully added competitors:');
    inserted.forEach(comp => {
      console.log(`\n📊 ${comp.name}`);
      console.log(`   Website: ${comp.website}`);
      console.log(`   Pages: ${comp.monitoredChannels.websitePages.length}`);
      console.log(`   RSS Feeds: ${comp.monitoredChannels.rssFeeds.length}`);
      console.log(`   Priority: ${comp.monitoringConfig.priority}`);
    });

    console.log('\n🎉 Seeding completed successfully!');
    console.log('💡 Tip: Restart your workers to start monitoring immediately');
    
  } catch (error) {
    console.error('❌ Error seeding competitors:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding
seedCompetitors();