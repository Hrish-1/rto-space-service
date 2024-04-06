
import mongoose  from 'mongoose'

const serviceSchema = new mongoose.Schema({
  serviceId: { type: String, required: true },
  serviceName: { type: String, required: true }
});

const service =mongoose.model('Service', serviceSchema);
export default service;