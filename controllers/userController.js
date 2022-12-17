require('dotenv').config()

const User = require('../models/userModel');
const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const wishlistData = require('../models/wishlistModel')
const addressData = require('../models/addressModel')
const bannerData = require('../models/bannerModel')
const brandData = require('../models/brandModel')

const bcrypt = require('bcrypt');
const client = require("twilio")(process.env.accountSID, process.env.authToken)


const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password, 10);
        return passwordHash;
    } catch (error) {
        console.log(error.message);
    }
}

const loadRegister = async(req,res)=>{
    try {
        res.render('registration')
        
    } catch (error) {
        console.log(error.message);
    }
}

const insertUser = async(req,res)=>{
    try {
        const spassword = await securePassword(req.body.password);
        const user = new User({
            name:req.body.name,
            email:req.body.email,
            mobile:req.body.mno,
            
            password:spassword,
            is_admin:0
        });

        const userData = await user.save();

        if(userData){
            res.render('otp',{userinfo:userData});

            client
                .verify
                .services(process.env.serviceID)
                .verifications
                .create({
                    to:req.body.mno,
                    channel:'sms'
                })
                .then((data)=>{
                    res.status(200).send(data)
                })
        }else{
            res.render('registration',{message:"Your registration has been failed."});
        }
    } catch (error) {
        console.log(error.messsage);
    }
}

const verifyPhone = (req, res)=>{

    client
        .verify
        .services(process.env.serviceID)
        .verificationChecks
        .create({
            to:`+${req.body.mobile}`,
            code:req.body.otp
        })
        .then(async(data)=>{
            if (data.valid) {
                const updateInfo = await User.updateOne({_id:req.body.id},{ $set:{ is_verified:1 } });
                res.render('login',{rgd:'Your registration was successfull! Please Login.'})
            } else {
                res.render('registration',{wotp:'Incorrect OTP! Try again'})
            }
            //res.status(200).send(data)
        })

}

//login user methods

const loginLoad = async(req,res)=>{
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
    
        const userData= await User.findOne({email:email});
    
        if (userData) {
            
            const passwordMatch = await bcrypt.compare(password,userData.password);

            if (passwordMatch) {
                if (userData.is_verified === 0) {
                    res.render('login',{message:"Please verify your phone."});
                }else if(userData.blockStatus){
                    res.render('login',{message:"This account is blocked."});
                }
                else if(userData.is_admin === 0){
                    req.session.user_id = userData._id;
                    res.redirect('/userhome');
                }else{
                    res.render('login',{message:"Email and password is incorrect"});
                }
            }else {
                res.render('login',{message:"Email and password is incorrect"});
            }
        }else {
            res.render('login',{message:"Email and password is incorrect"});
        }
    } catch (error) {
        console.log(error.message);
    }
}

const loaduserHome = async(req,res)=>{
    try {
        const userData =  await User.findById({ _id:req.session.user_id });
        const productData = await Product.find({deleted:false}).limit(4)
        const categoryData = await Category.find({ deleteStatus: false })
        const userId = req.session.user_id
        wishlistItems = await wishlistData.findOne({ userId })
        const banner = await bannerData.find({}).sort({ date: -1 })
        const brands = await brandData.find({deleteStatus: false}).limit(6)

        res.render('userhome',{ user:userData, product:productData, category:categoryData, wishlistItems, banner, brands });
    } catch (error) {
        console.log(error.message);
    }
}

const userLogout = async(req,res)=>{
    try {
        delete req.session.user_id;
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
}

const LandingPage = async(req, res)=>{
    try {
        const productData = await Product.find({deleted:false}).limit(4)
        const categoryData = await Category.find({ deleteStatus: false })
        const banner = await bannerData.find({}).sort({ date: -1 })
        const brands = await brandData.find({deleteStatus: false}).limit(6)

        res.render('userhome',{product:productData, category:categoryData, banner, brands })
    } catch (error) {
        console.log(error.message);
    }
}

const loadProduct = async(req, res)=>{
    try {
        const { id } = req.params
        const productDetails = await Product.findById(id)
        const categoryData = await Category.find({ deleteStatus: false })
        let userData
        if (req.session.user_id) {
            userData = await User.findById({ _id:req.session.user_id });
        }
        
        res.render('productDetails',{details:productDetails, category:categoryData, user:userData})
    } catch (error) {
        console.log(error.message);
    }
}

const saveAddress = async(req, res)=>{
    try {
        const { id } = req.params
        const count = await addressData.find({ id }).count()
        if (!req.body) {
            req.flash('error', 'Empty fields are not allowed')
            res.redirect('back')
        }
        else {
            const addr = await new addressData({
                userId: id,
                houseNo: req.body.houseNo,
                street: req.body.street,
                district: req.body.district,
                state: req.body.state,
                pincode: req.body.pincode
            })
            addr.save()
                .then(() => {
                    //req.flash('success', 'Address successfully added')
                    //res.redirect('back')
                    res.send("success")
                })
                .catch((err) => {
                    //res.render('error',{err})
                    console.log(err.message);
                })
        }
    } catch (error) {
        console.log(error.message);
    }
}

const userProfile = async(req, res)=>{
    try {
        const userId = req.params.id
        const address = await addressData.find({ userId })
        const user =  await User.findById({ _id:userId });
        res.render('Profile', { address, user })
    } catch (error) {
        console.log(error.message);
    }
}

const addAddress = async(req, res)=>{
    try {
        const user =  await User.findById({ _id:req.session.user_id });
        res.render('addAddress', {user})
    } catch (error) {
        console.log(error.message);
    }
}

const deleteAddress = async(req, res)=>{
    try {
        const { id } = req.params
        const deletion = await addressData.findOneAndDelete({ id })
        deletion.remove()
        res.send({ success: true })
    } catch (error) {
        console.log(error.message);
    }
}


module.exports = {
    loadRegister,
    insertUser,
    loginLoad,
    verifyLogin,
    userLogout,
    LandingPage,
    loaduserHome,
    verifyPhone,
    loadProduct,
    saveAddress,
    userProfile,
    addAddress,
    deleteAddress
}