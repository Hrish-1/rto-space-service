import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({

    deliveryNo: { type: Number, required: true },
    deliveryDate: Date,
    deliveryBy: String,
    services: String,
    vehicleNo:{ type: String, required: true },
    toRto: { type: String, required: true },
    deliveryPdfUrl:{ type: String, required: true }
  
});

const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery;