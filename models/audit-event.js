const mongoose = require('mongoose');

const auditEventSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('AuditEvent', auditEventSchema);
