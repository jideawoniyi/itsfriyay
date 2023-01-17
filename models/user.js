const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const uuid = require('uuid');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  phonenumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
  },
  wallet:{
    id: {
    type: String,
    default: uuid.v4()
  },
  balance: {
    type: Number,
    default: 0.0
  },
  isActive: {
    type: Boolean,
    default: false
  },
  currency: {
    code:{
    type: String,
    default: `CAD`
  },
    symbol:{
    type: String,
    default: `$`
  }
}
  
 
},
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  emailVerified: {
    type: Boolean,
    default: false
  }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
