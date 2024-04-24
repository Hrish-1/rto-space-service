import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({

    deliveryNo: { type: Number, required: true },
});

const DeliveryNumber = mongoose.model('DeliveryNumber', deliverySchema);
export default DeliveryNumber;