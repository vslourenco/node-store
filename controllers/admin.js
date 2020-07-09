const { validationResult } = require('express-validator');
const Product = require('../models/product');

exports.getAddProduct = (req, res) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    isAuthenticated: req.session.isLoggedIn,
    errorMessage: null,
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res) => {
  const { title } = req.body;
  const { imageUrl } = req.body;
  const { price } = req.body;
  const { description } = req.body;
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/edit-product',
      editing: false,
      product: {
        title,
        imageUrl,
        price,
        description,
      },
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: validationErrors.array()[0].msg,
      validationErrors: validationErrors.array(),
    });
  }
  new Product({
    title,
    price,
    description,
    imageUrl,
    userId: req.session.user,
  }).save()
    .then((result) => {
      console.log(result);
      res.redirect('/admin/products');
    }).catch((err) => {
      console.log(err);
    });
};

exports.getEditProduct = (req, res) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product,
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => console.log(err));
};

exports.postEditProduct = (req, res) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    return res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      product: {
        _id: prodId,
        title: updatedTitle,
        imageUrl: updatedImageUrl,
        price: updatedPrice,
        description: updatedDesc,
      },
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: validationErrors.array()[0].msg,
      validationErrors: validationErrors.array(),
    });
  }
  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.session.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      product.imageUrl = updatedImageUrl;
      return product.save()
        .then(() => {
          res.redirect('/admin/products');
        });
    })
    .catch((err) => console.log(err));
};

exports.getProducts = (req, res) => {
  Product.find({ userId: req.session.user })
    .then((products) => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => console.log(err));
};

exports.postDeleteProduct = (req, res) => {
  const prodId = req.body.productId;
  Product.deleteOne({ _id: prodId, userId: req.session.user })
    .then(() => {
      res.redirect('/admin/products');
    })
    .catch((err) => console.log(err));
};
