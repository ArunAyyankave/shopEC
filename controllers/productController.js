const Product = require("../models/productModel");
const Category = require("../models/categoryModel");
const Brand = require("../models/brandModel")
const User = require("../models/userModel")

const loadProducts = async(req,res)=>{
    try {
        const productData = await Product.find({deleted:false})
        res.render('products',{products:productData})
    } catch (error) {
        console.log(error.message);
    }
}

const newProductLoad = async(req, res)=>{
    try {
        const categories = await Category.find({deleteStatus: false})
        const brands = await Brand.find({deleteStatus: false})
        res.render('new-product',{categories, brands})
    } catch (error) {
        console.log(error.message);
    }
}

const addProduct = async(req, res)=>{
    try {

        const product = new Product({
            name:req.body.name,
            category:req.body.category,
            brand:req.body.brand,
            description:req.body.description,
            // image:req.file.filename,
            price:req.body.price,
            stock:req.body.stock
        });

        product.images = req.files.map(f => ({ url: f.path, filename: f.filename }))

        const productData = await product.save();

        if (productData) {
            //res.send('product added seccessfully')
            res.redirect('/admin/products')
        } else {
            res.render('new-user',{message:'Something went wrong...'});
        }
        
    } catch (error) {
        console.log();
    }
}

const editProductLoad = async(req, res)=>{
    try {
        const id = req.query.id;
        const productData = await Product.findById({ _id:id});
        const categories = await Category.find({deleteStatus: false})
        const brands = await Brand.find({deleteStatus: false})
        if (productData) {
            res.render('edit-product',{product:productData, categories, brands});
        } else {
            res.redirect('admin/products')
        }
    } catch (error) {
        console.log(error.message);
    }
}

const updateProduct = async(req, res)=>{
    try {
        
        if (req.files) {
            const productData = await Product.findByIdAndUpdate({ _id:req.body.id},{ $set:{ name:req.body.name, category:req.body.category, brand:req.body.brand, description:req.body.description, price:req.body.price, stock:req.body.stock}});
            const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }))
            productData.images.unshift(...imgs)
            await productData.save()
        } else {
            const productData = await Product.findByIdAndUpdate({ _id:req.body.id},{ $set:{ name:req.body.name, category:req.body.category, brand:req.body.brand, description:req.body.description, price:req.body.price, stock:req.body.stock}});
        }

        

        res.redirect('/admin/products')
        
    } catch (error) {
        console.log(error.message);
    }
}

const deleteProduct = async(req, res)=>{
    try {
        const id = req.query.id;
        await Product.findByIdAndUpdate(id, { deleted: true })
        res.redirect('/admin/products');
    } catch (error) {
        console.log(error.message);
    }
}

const allProducts = async (req, res) => {
    try {

        let sort = {};
        let query =  { deleted: false };
        if (req.query.searchText) {
            query.$or = [
                { name: { $regex: '.*' + req.query.searchText + '.*', $options: 'i' } }
            ]
        }

        let user
        if (req.session.user_id) {
            user =  await User.findById({ _id:req.session.user_id });
        }
        const products = await Product.find( query ).sort(sort).lean()
        res.render('allProducts', { products, user })
    } catch (err) {
        console.log(err.message);
    }
}

module.exports = {
    loadProducts,
    newProductLoad,
    addProduct,
    editProductLoad,
    updateProduct,
    deleteProduct,
    allProducts
}




