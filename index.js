require('dotenv').config()

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);

const express = require("express");
const app = express();

app.use(function (req, res, next) {
    res.set("Cache-Control", "no-cache,private,no-store,must-revalidate,max-stale=0,post-check=0,precheck=0");
    next();
})
const path = require("path")
app.use('CSS', express.static(path.join(__dirname, "/public")));
app.use('JS', express.static(path.join(__dirname, "/public")));

//for user routes
const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

//for admin routes
const adminRoute = require('./routes/adminRoute');
app.use('/admin', adminRoute);

app.listen(process.env.PORT, () => {
    console.log("Server is running...");
});