const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const Product = require('../models/product');
const Order = require('../models/order');
const User = require('../models/user');

const ITEMS_PER_PAGE = 3;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalPages;
  Product.find()
    .countDocuments()
    .then((numItems) => {
      totalPages = Math.ceil(numItems / ITEMS_PER_PAGE);
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        isAuthenticated: req.session.isLoggedIn,
        pagination: {
          pages: totalPages,
          currentPage: page,
          hasNext: totalPages > page,
          hasPrevious: page > 1,
        },
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render('shop/product-detail', {
        product,
        pageTitle: product.title,
        path: '/products',
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalPages;
  Product.find()
    .countDocuments()
    .then((numItems) => {
      totalPages = Math.ceil(numItems / ITEMS_PER_PAGE);
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        isAuthenticated: req.session.isLoggedIn,
        pagination: {
          pages: totalPages,
          currentPage: page,
          hasNext: totalPages > page,
          hasPrevious: page > 1,
        },
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.session.user = new User().init(req.session.user);
  req.session.user.populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  req.session.user = new User().init(req.session.user);
  Product.findById(prodId)
    .then((product) => req.session.user.addToCart(product))
    .then(() => {
      res.redirect('/cart');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.session.user = new User().init(req.session.user);
  req.session.user.removeFromCart(prodId)
    .then(() => {
      res.redirect('/cart');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.session.user = new User().init(req.session.user);
  req.session.user.populate('cart.items.productId')
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((item) => ({
        product: { ...item.productId._doc },
        quantity: item.quantity,
      }));
      const order = new Order({
        user: {
          email: req.session.user.email,
          userId: req.session.user,
        },
        products,
      });
      return order.save();
    })
    .then(() => req.session.user.clearCart())
    .then(() => {
      res.redirect('/orders');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.session.user._id })
    .then((orders) => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const { orderId } = req.params;

  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        throw new Error('No order found!');
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        throw new Error('Unauthorized!');
      }
      const invoiceName = `invoice-${orderId}.pdf`;
      const invoicePath = path.join('data', 'invoices', invoiceName);

      const pdfInvoice = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${invoiceName}"`);
      pdfInvoice.pipe(fs.createWriteStream(invoicePath));
      pdfInvoice.pipe(res);

      pdfInvoice.rect(0, pdfInvoice.y, 300, 85)
        .fill([3, 27, 123]);
      pdfInvoice.moveDown();
      pdfInvoice.moveDown();
      let currentY = pdfInvoice.y;
      pdfInvoice.font('Times-Bold', 50).fillColor('white').text('INVOICE', 0, currentY, { width: 300, align: 'center' });
      pdfInvoice.image('./public/img/logo-color.png', 380, currentY, { width: 200 });
      pdfInvoice.moveDown();

      pdfInvoice.font('Times-Bold', 20).fillColor('black').text(`ORDER #${orderId}`, 72, pdfInvoice.y, { align: 'justify' });
      pdfInvoice.moveDown();
      pdfInvoice.moveDown();

      currentY = pdfInvoice.y;
      let currentX = pdfInvoice.x;
      pdfInvoice.rect(currentX, currentY - 5, 500, 20)
        .fill([3, 27, 123]);
      pdfInvoice
        .fontSize(14)
        .fillColor([255, 255, 255])
        .text(' Product', currentX, currentY, { width: 200, align: 'justify' })
        .text('Price', currentX + 200, currentY, { width: 100, align: 'justify' })
        .text('Quantity', currentX + 300, currentY, { width: 100, align: 'justify' })
        .text('Total', currentX + 400, currentY, { width: 100, align: 'justify' })
        .moveDown();

      currentX = 72;
      let totalPrice = 0;
      order.products.forEach((prod) => {
        currentY = pdfInvoice.y;
        pdfInvoice
          .fontSize(13)
          .fillColor('black')
          .text(prod.product.title, currentX, currentY, { width: 200, align: 'justify' })
          .text(`$ ${prod.product.price}`, currentX + 200, currentY, { width: 100, align: 'justify' })
          .text(prod.quantity, currentX + 300, currentY, { width: 100, align: 'justify' })
          .text(`$ ${prod.product.price * prod.quantity}`, currentX + 400, currentY, { width: 100, align: 'justify' })
          .moveDown();
        totalPrice += prod.product.price * prod.quantity;
      });

      currentY = pdfInvoice.y;
      pdfInvoice.rect(currentX + 300, currentY - 5, 200, 20)
        .fill([3, 27, 123]);
      pdfInvoice
        .fillColor([255, 255, 255])
        .text('Total', currentX + 300, currentY, { width: 100, align: 'justify' })
        .text(`$ ${totalPrice}`, currentX + 400, currentY, { width: 100, align: 'justify' });

      pdfInvoice.end();

      // const file = fs.createReadStream(invoicePath);
      // file.pipe(res);
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout',
    isAuthenticated: req.session.isLoggedIn,
  });
};
