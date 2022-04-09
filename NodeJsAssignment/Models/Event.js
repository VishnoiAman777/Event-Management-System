const mongoose = require('mongoose');
const { Schema } = mongoose;

const EventSchema = new Schema({
    user:{type:mongoose.Schema.Types.ObjectId, ref:'user'},
    title:  {type:String,required: true},
    description: { type:String, required: true},
    date: {type:Date, default: Date.now},
    invites: [String]    
});

module.exports = mongoose.model('event', EventSchema);