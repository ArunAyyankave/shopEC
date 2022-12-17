const User = require("../models/userModel");
const brandData = require('../models/brandModel')
const categoryData = require('../models/categoryModel')
const checkoutData = require('../models/checkoutModel')

const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const mongoose = require('mongoose')

const loadLogin = async(req,res)=>{
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}

const verifyLogin = async(req,res)=>{
    try {

        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email:email});

        if (userData) {
            
            const passwordMatch = await bcrypt.compare(password,userData.password);

            if (passwordMatch) {
                if (userData.is_admin === 0) {
                    res.render('login',{message:"Email and password is incorrect"});
                }else {
                    req.session.admin_id = userData._id;
                    res.redirect("/admin/home");
                }
            }else {
                res.render('login',{message:"Email and password is incorrect"});
            }
        }else{
            res.render('login',{message:"Email and password is incorrect"});
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loadDashboard = async(req, res)=>{
    try {
        const userData = await User.findById({_id:req.session.admin_id});
        // res.render('home',{admin:userData});

        const dailySale = await checkoutData.find({ $and: [{ createdAt: { $lt: Date.now(), $gt: Date.now() - 86400000 } }, { 'orderStatus.type': { $ne: 'Cancelled' } }] })
        let todaySale = 0
        dailySale.forEach((s) => {
            todaySale += s.bill
        })
        let totalSale = 0


        const sale = await checkoutData.find({ 'orderStatus.type': { $ne: 'Cancelled' } })
        sale.forEach((s) => {
            totalSale += s.bill
        })
        todayRevenue = todaySale * 10 / 100
        totalRevenue = totalSale * 10 / 100
        const completed = await checkoutData.find({ isCompleted: true }).sort({ createdAt: -1 }).limit(10)
        const graph = await checkoutData.aggregate(
            [
                {
                    $group: {
                        _id: { month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" }, year: { $year: "$createdAt" } },
                        totalPrice: { $sum: '$bill' },
                        count: { $sum: 1 }

                    }

                }, { $sort: { _id: -1 } },
                { $project: { totalPrice: 1, _id: 0 } }, { $limit: 7 }
            ]
        );

        let values = [];
        let revenue = []
        graph.forEach((g) => {
            values.push(g.totalPrice)
            revenue.push(g.totalPrice * 10 / 100)
        })

        const ordered = await checkoutData.find({ 'orderStatus.type': 'Ordered' }).count()
        const packed = await checkoutData.find({ 'orderStatus.type': 'Packed' }).count()
        const shipped = await checkoutData.find({ 'orderStatus.type': 'Shipped' }).count()
        const delivered = await checkoutData.find({ 'orderStatus.type': 'Delivered' }).count()
        const cancelled = await checkoutData.find({ 'orderStatus.type': 'Cancelled' }).count()


        res.render('home', {admin:userData, todaySale, totalSale, todaySale, totalRevenue, completed, values, revenue, ordered, packed, shipped, delivered, cancelled })
    } catch (error) {
        console.log(error.message);
    }
}

const logout = async(req,res)=>{
    try {
        delete req.session.admin_id;
        res.redirect('/admin');
    } catch (error) {
        console.log(error.message);
    }
}

const loadUsers = async(req,res)=>{
    try {
        const userData = await User.find({is_admin:0})
        res.render('users',{users:userData});
    } catch (error) {
        console.log(error.message);
    }
}

const editUser = async(req,res)=>{
    try {
        const { id } = req.params

        const user = await User.findById(id)

        if (user.blockStatus == false) {
            await User.findByIdAndUpdate(id, { blockStatus: true })
            res.send({ success: true })
        } else {
            await User.findByIdAndUpdate(id, { blockStatus: false })
            res.send({ success: true })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const productOrders = async(req, res)=>{
    try {
        const orderData = await checkoutData.find({}).sort({ 'orderStatus.date': -1 })
        orderId = mongoose.Types.ObjectId(orderData._Id)
        res.render('orders', { orderData, orderId })
    } catch (error) {
        console.log(error.message);
    }
}

const orderItems = async(req, res)=>{
    try {
        const carId = req.body
        const cartId = mongoose.Types.ObjectId(carId)
        const cartList = await checkoutData.aggregate([{ $match: { _id: cartId } }, { $unwind: '$cartItems' },
        { $project: { item: '$cartItems.productId', itemQuantity: '$cartItems.quantity' } },
        { $lookup: { from: 'products', localField: 'item', foreignField: '_id', as: 'product' } }]);

        res.send({ cartList })
    } catch (error) {
        console.log(error.message);
    }
}

const editOrder = async(req, res)=>{
    try {
        const { id } = req.params
        const orderData = await checkoutData.findById(id)
        res.render('editOrder', { orderData })
    } catch (error) {
        console.log(error.message)
    }
}

const updateOrder = async(req, res)=>{
    try {
        const { id } = req.params
        await checkoutData.findByIdAndUpdate(id, {

            orderStatus: {
                type: req.body.orderStatus,
                date: req.body.date

            }
        })
        const orderData = await checkoutData.findById(id)
        if (orderData.orderStatus[0].type == 'Delivered' && orderData.paymentStatus == 'cod') {
            await checkoutData.findByIdAndUpdate(id, {
                isCompleted: true
            })
        } else {
            await checkoutData.findOneAndUpdate({ $and: [{ _id: id }, { paymentStatus: 'cod' }] }, {
                isCompleted: false
            })
        }
        // req.flash('success', 'Order updated Successfully')
        res.redirect('/admin/orders')
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    loadUsers,
    editUser,
    productOrders,
    orderItems,
    editOrder,
    updateOrder
}