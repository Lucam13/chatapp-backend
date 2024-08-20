import mongoose from "mongoose";

const AreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  user_id: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
},
{
  strictPopulate: false,
}
);

const Area = mongoose.model("Area", AreaSchema);

export default Area;
