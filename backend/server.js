const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const User = require('./models/User');
const Transaction = require('./models/Transaction');
const Category = require('./models/Category');


const auth = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Atlas connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

mongoose.connection.on('connected', () => {
  console.log('Connected to database:', mongoose.connection.db.databaseName);
});


app.post('/api/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key');
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', [
  body('email').isEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let { email, password } = req.body;

    email = email.trim().toLowerCase();
    password = password.trim();

    const user = await User.findOne({ email });
    if (!user) {
      console.log('No user found for email:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('bcrypt.compare() result:', isMatch);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/transactions', auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.userId }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.post('/api/transactions', auth, [
  body('amount').isNumeric(),
  body('type').isIn(['income', 'expense']),
  body('category').notEmpty(),
  body('description').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const transaction = new Transaction({ ...req.body, user: req.userId });
    await transaction.save();

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/transactions/:id', auth, async (req, res) => {
  try {
    const oldTransaction = await Transaction.findOne({ _id: req.params.id, user: req.userId });
    if (!oldTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/transactions/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


app.get('/api/categories', auth, async (req, res) => {
  try {
    const categories = await Category.find({ user: req.userId });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/categories', auth, [
  body('name').notEmpty(),
  body('type').isIn(['income', 'expense'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type } = req.body;
    const normalizedName = name.trim().toLowerCase();

    const existingCategories = await Category.find({ 
      user: req.userId 
    });

    const similarCategory = existingCategories.find(cat => 
      cat.name.toLowerCase() === normalizedName ||
      cat.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(cat.name.toLowerCase())
    );

    if (similarCategory) {
      return res.status(400).json({ 
        message: `Similar category "${similarCategory.name}" (${similarCategory.type}) already exists. Use that instead?`,
        similarCategory: similarCategory
      });
    }

    const category = new Category({ 
      name: normalizedName, 
      type, 
      user: req.userId 
    });
    
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Category already exists' 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.put('/api/categories/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/categories/:id', auth, async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/analytics/spending-by-category', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const transactions = await Transaction.find({
      user: req.userId,
      type: 'expense',
      ...dateFilter
    });

    const spendingByCategory = transactions.reduce((acc, transaction) => {
      const category = transaction.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += transaction.amount;
      return acc;
    }, {});

    const data = Object.entries(spendingByCategory).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    })).sort((a, b) => b.amount - a.amount);

    res.json({
      success: true,
      data: data,
      totalSpent: data.reduce((sum, item) => sum + item.amount, 0)
    });
  } catch (error) {
    console.error('Error fetching spending by category:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch spending data',
      error: error.message 
    });
  }
});

app.get('/api/analytics/income-vs-expenses', auth, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const transactions = await Transaction.find({
      user: req.userId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    const monthlyData = transactions.reduce((acc, transaction) => {
      const month = new Date(transaction.date).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expenses += transaction.amount;
      }
      
      return acc;
    }, {});

    const data = Object.entries(monthlyData)
      .map(([month, amounts]) => ({
        month,
        income: parseFloat(amounts.income.toFixed(2)),
        expenses: parseFloat(amounts.expenses.toFixed(2)),
        net: parseFloat((amounts.income - amounts.expenses).toFixed(2))
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: data,
      period: `${months} months`
    });
  } catch (error) {
    console.error('Error fetching income vs expenses:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch income vs expenses data',
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));