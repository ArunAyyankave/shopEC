const express = require("express");
const admin_route = express();
require('dotenv').config()

const session = require("express-session");
// const config = require("../config/config");
admin_route.use(session({secret:process.env.sessionSecret, resave:false, saveUninitialized:true}));

const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

const multer = require("multer");
const path = require("path");

const cloudinary = require('../utils/cloudinary')
const { storage } = require('../utils/cloudinary')
const upload = multer({ storage })

admin_route.use(express.static('public'));

const auth = require("../middleware/adminAuth");

const adminController = require("../controllers/adminController");

admin_route.get('/',auth.isLogout,adminController.loadLogin);

admin_route.post('/',adminController.verifyLogin);

admin_route.get('/home',auth.isLogin,adminController.loadDashboard);

admin_route.get('/logout',auth.isLogin,adminController.logout);

admin_route.get('/dashboard',auth.isLogin,adminController.loadUsers);

admin_route.put('/editUser/:id',adminController.editUser);


//for products start
const productController = require("../controllers/productController");

admin_route.get('/products',auth.isLogin,productController.loadProducts);

admin_route.get('/new-product',auth.isLogin,productController.newProductLoad);
admin_route.post('/new-product',upload.array('image'),productController.addProduct);

admin_route.get('/edit-product',auth.isLogin, productController.editProductLoad);
admin_route.post('/edit-product',upload.array('image'),productController.updateProduct);

admin_route.get('/delete-product',productController.deleteProduct);
//product end

//categories start
const categoryController = require("../controllers/categoryController");

admin_route.get('/categories',auth.isLogin,categoryController.loadCategories)

//admin_route.get('/new-category',auth.isLogin,categoryController.newCategoryLoad);
admin_route.post('/new-category',categoryController.addCategory);

//admin_route.get('/edit-category',auth.isLogin, categoryController.editCategoryLoad);
admin_route.post('/edit-category',categoryController.updateCategory);

admin_route.get('/delete-category',categoryController.deleteCategory);
//categories end

//brands start
const brandController = require("../controllers/brandController");

admin_route.get('/brands',auth.isLogin,brandController.loadBrands)

admin_route.post('/new-brand', upload.array('image'), brandController.addBrand);

//admin_route.get('/edit-brand',auth.isLogin, brandController.editBrandLoad);
admin_route.post('/edit-brand',brandController.updateBrand);

admin_route.get('/delete-brand',brandController.deleteBrand);
//brands end

//coupen
const couponController = require('../controllers/couponController') 

admin_route.get('/coupons', auth.isLogin, couponController.coupens)
admin_route.get('/addCoupen', auth.isLogin, couponController.addCoupen)
admin_route.post('/saveCoupen', auth.isLogin, couponController.saveCoupen)
admin_route.delete('/deleteCoupen/:id', auth.isLogin, couponController.deleteCoupen)

//orders
admin_route.get('/orders',auth.isLogin, adminController.productOrders)
admin_route.post('/orderitems',auth.isLogin, adminController.orderItems)
admin_route.get('/editOrders/:id', auth.isLogin, adminController.editOrder)
admin_route.post('/updateOrder/:id', auth.isLogin, adminController.updateOrder)

//banners
const bannerController = require('../controllers/bannerController')

admin_route.get('/setBanner',auth.isLogin, bannerController.setBanner)
admin_route.get('/addbanner',auth.isLogin, bannerController.addBanner)
admin_route.post('/addBanner/add',auth.isLogin, upload.array('image'), bannerController.saveBanner)


admin_route.get('*',function(req,res){

    res.redirect('/admin');

})

module.exports = admin_route;