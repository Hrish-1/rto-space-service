import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const rtoSchema = new Schema({
    rto: {
        type: String,
        required: true,
        unique: true
    },
    rtoName: {
        type: String,
        required: true
    }
});

const RTO = mongoose.model('RTO', rtoSchema);
export default RTO;
