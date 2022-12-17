
const User = require('../models/userModel');
const productData = require('../models/productModel')
const Category = require("../models/categoryModel");
const wishlistData = require('../models/wishlistModel')
const cartData = require('../models/cartModel')

const loadCategories = async(req,res)=>{
    try {
        const categoryData = await Category.find({ deleteStatus: false })
        res.render('categories',{categories:categoryData})
    } catch (error) {
        console.log(error.message);
    }
}

const newCategoryLoad = async(req, res)=>{
    try {
        res.render('new-category')
    } catch (error) {
        console.log(error.message);
    }
}

const addCategory = async(req, res)=>{
    try {

        const product = new Category({
            name:req.body.name,
        });

        const CategoryData = await product.save();

        if (CategoryData) {
            //res.send('Category added successfully')
            res.redirect('/admin/categories')
        } else {
            res.render('new-category',{message:'Something went wrong...'});
        }
        
    } catch (error) {
        console.log();
    }
}

const editCategoryLoad = async(req, res)=>{
    try {
        const id = req.query.id;
        const categoryData = await Category.findById({ _id:id});
        if (categoryData) {
            res.render('edit-category',{category:categoryData});
        } else {
            res.redirect('admin/categories')
        }
    } catch (error) {
        console.log(message.error);
    }
}

const updateCategory = async(req, res)=>{
    try {

        const categoryData = await Category.findByIdAndUpdate({ _id:req.body.id},{ $set:{ name:req.body.name}});

        res.redirect('/admin/categories')
        
    } catch (error) {
        console.log(error.message);
    }
}

const deleteCategory = async(req, res)=>{
    try {
        const id = req.query.id;
        await Category.findByIdAndUpdate(id, { deleteStatus: true })
        res.redirect('/admin/categories');
    } catch (error) {
        console.log(error.message);
    }
}

const singleProduct = async(req, res)=>{
    try {
        const catId = req.params.id
        const category = await Category.findById({_id:catId})
        const cata = category.name
        const products = await productData.find({$and:[{
            category:{$eq:cata}},{deleted:false}]
        })
        // const justArrived = await productData.find({
        //     $and:[{category:{$eq:cata}},{expiresAt:{$gte: Date.now()}}]
        // })
        const categories = await Category.find({deleteStatus: false})
        const courosels = await productData.find({ $and:[{
            discount:{$gt:10}},{deleted:false}] 
        })
        let cartItems 
        let wishlistItems 
        let user
        if(req.session.user_id){
            const userId = req.session.user_id
            cartItems = await cartData.findOne({userId})
            wishlistItems = await wishlistData.findOne({userId})

            user =  await User.findById({ _id:req.session.user_id });
        }
        res.render('singleProduct',{products,categories,courosels,cartItems,wishlistItems,cata,user})
    } catch (error) {
        console.log(error.message);
    }
}

module.exports = {
    loadCategories,
    newCategoryLoad,
    addCategory,
    editCategoryLoad,
    updateCategory,
    deleteCategory,

    singleProduct
}




