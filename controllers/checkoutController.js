require('dotenv').config()

const userData = require('../models/userModel');
const checkoutData = require('../models/checkoutModel');
const coupenData = require('../models/coupenModel')
const addressData = require('../models/addressModel')
const cartData = require('../models/cartModel')
const mongoose = require('mongoose')

const Razorpay = require('razorpay')

const checkoutPage = async (req, res)=>{
    try {

        if(req.session.user_id){
            
            const user_Id = req.session.user_id   
            const user = await userData.findById(user_Id)
            const userId = mongoose.Types.ObjectId(user_Id)
            const address = await addressData.find({user_Id})
            const cartList = await cartData.aggregate([{$match:{userId}},{$unwind:'$cartItems'},
                        {$project:{item:'$cartItems.productId',itemQuantity:'$cartItems.quantity'}},
                        {$lookup:{from:"products",localField:'item',foreignField:'_id',as:'product'}}]);
            //console.log(cartList);
            const items = await cartData.findOne({userId})
            let coupencode 
            if(items.coupenCode){
                coupencode = items.coupenCode
            }
            
            let discount;
            if(coupencode) {
                const coupens = await coupenData.findOne({code:coupencode})
                discount = coupens.discount
            }
        let total;
        let subtotal = 0;
        
        cartList.forEach((p) => {
            p.product.forEach((p2)=> {
                total = parseInt(p2.price)*parseInt(p.itemQuantity)
                subtotal += total
            })
        })
        let shipping ;
        if(subtotal < 15000) {
            shipping = 50
        } else {
            shipping = 0
        }
        let grandtotal
        if(discount) {
            grandtotal = subtotal+shipping-discount
        } else {
            grandtotal = subtotal+shipping
        }
            res.render('checkout',{user,address,cartList,grandtotal,shipping,subtotal,discount})
        } else {
            //req.flash('error','You are not logged in')
            res.redirect('back')
        }
        
    } catch (error) {
        console.log(error.message);
    }
}

const checkoutAddress = async (req, res)=>{
    try {
        const user = req.session.user_id
        const userId = mongoose.Types.ObjectId(user)
        const cartList = await cartData.aggregate([{$match:{userId:userId}},{$unwind:'$cartItems'},
                        {$project:{item:'$cartItems.productId',itemQuantity:'$cartItems.quantity'}},
                        {$lookup:{from:"products",localField:'item',foreignField:'_id',as:'product'}}]);

        res.render('checkoutAddAddress',{cartList, user})
    } catch (error) {
        console.log(error.message);
    }
}

//rz pay
const instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET
})

function generateRazorpay(orderId, bill) {
    return new Promise((resolve, reject) => {
        const options = {
            amount: bill * 100,
            currency: "INR",
            receipt: `${orderId}`
        };
        instance.orders.create(options, function (err, order) {
            if (err) {
                console.log(err)
            } else {
                // console.log(order)
                resolve(order)
            }
        })
    })

}

function verifyPayment(details) {
    return new Promise((resolve, reject) => {
        const crypto = require('crypto')
        let hmac = crypto.createHmac('sha256', process.env.KEY_SECRET)
        hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id, process.env.KEY_SECRET)
        hmac = hmac.digest('hex')
        if (hmac == details.payment.razorpay_signature) {
            resolve()
        } else {
            reject()
        }
    })
}

const placeOrder = async (req, res)=>{
    try {
        const usrId = req.session.user_id
        const userId = new mongoose.Types.ObjectId(usrId)
        const prodId = req.body.cartId
        const cartId = new mongoose.Types.ObjectId(prodId)
        const items = await cartData.findById({_id:cartId})
        const coupencode = items.coupenCode
        let discount;
        if(coupencode) {
            const coupens = await coupenData.findOne({code:coupencode})
            discount = coupens.discount

        }
        const cartList = await cartData.aggregate([{$match:{userId:userId}},{$unwind:'$cartItems'},
                        {$project:{item:'$cartItems.productId',itemQuantity:'$cartItems.quantity'}},
                        {$lookup:{from:"products",localField:'item',foreignField:'_id',as:'product'}}]);
        
        let total;
        let subtotal = 0;
        
        cartList.forEach((p) => {
            p.product.forEach((p2)=> {
                total = parseInt(p2.price)*parseInt(p.itemQuantity)
                subtotal += total
            })
        })
        let shipping ;
        if(subtotal < 15000) {
            shipping = 50
        } else {
            shipping = 0
        }
        const bill = subtotal + shipping
        let status = req.body.payment === 'cod'? false:true

        const orderData = new checkoutData ({
            userId,
            cartItems: items.cartItems,
            address: {
               name: req.body.name,
               email: req.body.email, 
               mobile: req.body.mobile,
               addressLine: req.body.addressLine
            },
            paymentStatus: req.body.payment,
            orderStatus: {
                date:Date.now()
            },
            
            bill,
            discount,
            isCompleted: status

        })
        orderData
        .save()
        .then((orderData) => {
           
            if(orderData.paymentStatus == 'cod') {
                (async function d(){
                    await cartData.deleteOne({_id:cartId})
                })();
                const codSuccess = true
                res.send({codSuccess})
            } else {
                const orderId = orderData._id
                const total = orderData.bill
                generateRazorpay(orderId,total).then((response) => {
                    res.json(response)
                })
            }
            
        })
        .catch((err) => {
            console.log(err.message);
        })
        
        
    } catch (error) {
        console.log(error.message);
    }
}

const orderSuccess = async (req, res)=>{
    try {
        const userId = req.session.user_id
        const productId = req.params
        const cartList = await cartData.aggregate([{$match:{_id:productId}},{$unwind:'$cartItems'},
                        {$project:{item:'$cartItems.productId',itemQuantity:'$cartItems.quantity'}},
                        {$lookup:{from:'products',localField:'item',foreignField:'_id',as:'product'}}]);
        let total;
        let subtotal = 0;
        
        cartList.forEach((p) => {
            p.product.forEach((p2)=> {
                total = parseInt(p2.price)*parseInt(p.itemQuantity)
                subtotal += total
            })
        })
        let shipping = 0;
        if(subtotal < 15000) {
            shipping = 150
        } else {
            shipping = 0
        }
        const bill = subtotal+shipping
        const orderData = await checkoutData.find({userId})
        res.render('orderSuccess',{cartList,bill,shipping,orderData})
    } catch (error) {
        console.log(error.message);
    }
}

const verifyPay = async(req, res)=>{
    verifyPayment(req.body).then(() => {
        changePaymentStatus(req.body).then(() => {
            res.json({status:true})
        }).catch((err) => {
            res.json({status:false,errMsg:''})
        })
    }).catch((err) => {
        //res.render('error',{err})
        console.log(err.message);
    })
}

function changePaymentStatus(orderId) {
    return new Promise((resolve,reject) => {
        const Id = mongoose.Types.ObjectId(orderId.id)
        checkoutData.findByIdAndUpdate({_id:Id},{$set:{
                isCompleted: true
            }}).then(()=>{
                resolve()
            }).catch((err) => {
                res.render('error',{err})
            })
       
    })
}

const viewOrders = async(req, res)=>{
    try {
        userId = req.session.user_id
        const orderData = await checkoutData.find({userId}).sort({'orderStatus.date':-1})
        res.render('orderDetails',{orderData})
    } catch (error) {
        console.log(error.message);
    }
}

const orderedProducts = async(req,res)=>{
    try {
        const cartId = mongoose.Types.ObjectId(req.body)
        const cartList = await checkoutData.aggregate([{$match:{_id:cartId}},{$unwind:'$cartItems'},
                        {$project:{item:'$cartItems.productId',itemQuantity:'$cartItems.quantity'}},
                        {$lookup:{from:'products',localField:'item',foreignField:'_id',as:'product'}}]);
        
        res.send({cartList})
    } catch (error) {
        console.log(error.message);
    }
}

const cancelOrder = async(req, res)=>{
    try {
        const {id} = req.params
        await checkoutData.findByIdAndUpdate(id,{
            orderStatus: {
                type: "Cancelled"
            },
            isCompleted: false
        })
        res.send({status:true})
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    checkoutPage,
    checkoutAddress,
    placeOrder,
    orderSuccess,
    verifyPay,
    viewOrders,
    orderedProducts,
    cancelOrder
}
