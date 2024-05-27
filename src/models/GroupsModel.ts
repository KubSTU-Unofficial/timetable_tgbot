import mongoose from "mongoose";

const schema = new mongoose.Schema({
    group: {
        type: String,
        required: true,
    },
    inst_id: {
        type: Number,
        required: true,
    },
    token: {
        type: String,
        required: true
    }
}, { collection: "groups", versionKey: false });

export default mongoose.model("groups", schema);

