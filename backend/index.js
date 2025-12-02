// index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./config/cloudinary'); // your cloudinary config
const e_commerce_users = require('./models/user');
const product_schema = require('./models/product');
const cart = require('./models/cart')

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ------------------------------
// MongoDB connection
// ------------------------------
mongoose.connect('mongodb://localhost:27017/ecommerce') // replace with MongoDB Atlas URI for production
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

// ------------------------------
// User Routes
// ------------------------------

// Signup
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await e_commerce_users.findOne({ email });
    if (exists) return res.status(400).send("User already exists");

    const user = await e_commerce_users.create({ name, email, password });
    res.status(201).send(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await e_commerce_users.findOne({ email });
    if (!user) return res.status(404).send("User not found");
    if (user.password !== password) return res.status(400).send("Incorrect password");

    // ⭐ always send full user object with _id
    res.send({
      message: "User logged in",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});


// Get user profile
app.get('/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await e_commerce_users.findOne({ email });
    if (!user) return res.status(404).send("User not found");
    res.send(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// Update profile
app.put('/profile/update', async (req, res) => {
  try {
    const { name, email, address } = req.body;
    const user = await e_commerce_users.findOneAndUpdate(
      { email },
      { name, address },
      { new: true }
    );
    res.send(user);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// ------------------------------
// Cloudinary product upload
// ------------------------------
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce_products',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const parser = multer({ storage });

app.post('/admin', parser.single('pro_image'), async (req, res) => {
  try {
    const { pro_name, pro_price } = req.body;
    const imageUrl = req.file.path; // Cloudinary URL

    const pro = await product_schema.create({
      product_name: pro_name,
      product_price: pro_price,
      product_image: imageUrl,
    });

    res.status(201).send(pro);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

// Get all products
app.get('/products', async (req, res) => {
  try {
    const products = await product_schema.find();
    res.send(products);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

app.post('/cart', async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
      return res.status(400).json({ message: "Missing user_id or product_id" });
    }

    const newItem = await cart.create({
      user_id,
      product_id,
      quantity: 1
    });

    res.send({ message: "Item added to cart", newItem });

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

app.get('/viewcart', async (req, res) => {
  try {
    const userId = req.query.userId; // get userId from frontend
    // Populate product details
    const cartItems = await cart.find({ user_id: userId }).populate('product_id');
    res.send(cartItems);
  } catch (err) {
    
    res.status(500).send('Server error');
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await product_schema.findById(id);
    if (!product) return res.status(404).send({ message: "Product not found" });
    res.send(product);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});


// ------------------------------
// Start server
// ------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
