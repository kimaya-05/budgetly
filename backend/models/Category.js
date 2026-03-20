const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    set: function(name) {
      // Normalize: lowercase, remove extra spaces
      return name.trim().toLowerCase().replace(/\s+/g, ' ');
    }
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Prevent duplicate categories for same user
categorySchema.index({ name: 1, user: 1 }, { unique: true });

// Add this to see which collection is being used
categorySchema.post('save', function(doc) {
  console.log('Category saved to collection:', doc.collection.name);
});

module.exports = mongoose.model('Category', categorySchema);