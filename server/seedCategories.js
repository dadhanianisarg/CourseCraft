const mongoose = require("mongoose");
const Category = require("./models/Category");
require("dotenv").config();

// Connect to database
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB Connected Successfully"))
  .catch((error) => {
    console.log("DB Connection Failed");
    console.error(error);
    process.exit(1);
  });

// Sample categories to seed
const categories = [
  {
    name: "Web Development",
    description: "Courses related to web development including HTML, CSS, JavaScript, React, Node.js, and more"
  },
  {
    name: "Data Science",
    description: "Learn data analysis, machine learning, statistics, and data visualization"
  },
  {
    name: "AI/ML",
    description: "Artificial Intelligence and Machine Learning courses covering neural networks, deep learning, and AI applications"
  },
  {
    name: "Mobile Development",
    description: "Build mobile applications for iOS and Android using React Native, Flutter, Swift, and Kotlin"
  },
  {
    name: "DevOps",
    description: "Learn about CI/CD, Docker, Kubernetes, cloud platforms, and automation tools"
  },
  {
    name: "Cybersecurity",
    description: "Network security, ethical hacking, cryptography, and security best practices"
  },
  {
    name: "Cloud Computing",
    description: "AWS, Azure, Google Cloud, and cloud architecture courses"
  },
  {
    name: "Database Management",
    description: "SQL, NoSQL, MongoDB, PostgreSQL, and database design"
  },
  {
    name: "Programming Languages",
    description: "Python, Java, C++, JavaScript, and other programming language fundamentals"
  },
  {
    name: "UI/UX Design",
    description: "User interface and user experience design, Figma, prototyping, and design thinking"
  }
];

// Seed function
async function seedCategories() {
  try {
    // Clear existing categories (optional - comment out if you want to keep existing ones)
    // await Category.deleteMany({});
    // console.log("Existing categories cleared");

    // Check which categories already exist
    const existingCategories = await Category.find({});
    const existingNames = existingCategories.map(cat => cat.name);
    
    console.log("Existing categories:", existingNames);
    console.log("Total existing:", existingCategories.length);

    // Filter out categories that already exist
    const newCategories = categories.filter(cat => !existingNames.includes(cat.name));

    if (newCategories.length === 0) {
      console.log("All categories already exist!");
      console.log("Categories in DB:", existingNames);
      return;
    }
    
    console.log(`Adding ${newCategories.length} new categories...`);

    // Insert new categories
    const result = await Category.insertMany(newCategories);
    console.log(`${result.length} categories seeded successfully!`);
    console.log("Categories added:", result.map(cat => cat.name).join(", "));

  } catch (error) {
    console.error("Error seeding categories:", error);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the seed function
seedCategories();
