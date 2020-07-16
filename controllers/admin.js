const { validationResult } = require('express-validator');
const Product = require('../models/product');
const fileHelper = require('../util/file');

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

exports.postAddProduct = (req, res, next) => {
  const { title } = req.body;
  const image = req.file;
  const { price } = req.body;
  const { description } = req.body;
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty() || !image) {
    return res.render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/edit-product',
      editing: false,
      product: {
        title,
        price,
        description,
      },
      isAuthenticated: req.session.isLoggedIn,
      errorMessage: !image ? 'Attach a valid image' : validationErrors.array()[0].msg,
      validationErrors: validationErrors.array(),
    });
  }
  new Product({
    title,
    price,
    description,
    imageUrl: image.path,
    userId: req.session.user,
  }).save()
    .then((result) => {
      console.log(result);
      res.redirect('/admin/products');
    }).catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      console.log(error);

      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
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
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
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
      if (image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save()
        .then(() => {
          res.redirect('/admin/products');
        });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.session.user })
    .then((products) => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products',
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        throw new Error('Product not Found!');
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: prodId, userId: req.session.user });
    })
    .then(() => {
      res.status(200).json({message: "Success"});
    })
    .catch((err) => {
      res.status(500).json({message: "Deleting product failed."});
    });
};