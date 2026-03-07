const getStatus = (req, res) => {
  res.json({ success: true, data: { online: true, lastSync: null } });
};

const downloadMaster = (req, res) => {
  res.json({ success: true, data: { items: [], customers: [], suppliers: [] } });
};

const uploadData = (req, res) => {
  res.json({ success: true, data: { received: (req.body.transactions || []).length || 0 } });
};

const getQueue = (req, res) => {
  res.json({ success: true, data: [] });
};

const clearQueue = (req, res) => {
  res.json({ success: true, message: 'Queue cleared' });
};

module.exports = {
  getStatus,
  downloadMaster,
  uploadData,
  getQueue,
  clearQueue
};
