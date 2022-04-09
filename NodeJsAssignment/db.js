const mongoose = require('mongoose'); 
const connectDB = async ()=> {
    mongoose.connect('mongodb://localhost:27017/eventManager', function(){
        console.log("Connected to Database");
    });
}

module.exports = connectDB;

