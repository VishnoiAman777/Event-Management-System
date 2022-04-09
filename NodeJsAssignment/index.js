// Adding the required imports
const express =  require('express');
const connectDB  = require('./db');
const app = express();


// Specifying the middleware functions
app.use(express.json());

// Specifying the ports where our application will listen
const port = 3000;

// connecting to local mongodb server
connectDB();

// Avialable Routes
// Route for quering the user
app.use('/api/auth', require('./routes/auth'));
// Route for querying the event
app.use('/api/event', require('./routes/event'));


app.listen(port, ()=>{
    console.log(`Application listening on port ${port}`);
})