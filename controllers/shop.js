const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  Product.findAll()
    .then((products) => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findByPk(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.findAll()
    .then((products) => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err => console.log(err));
};

exports.getCart = (req, res, next) => {
  req.user.getCart()
    .then(cart => {
      return cart.getProducts();
    })
    .then(products => {
      console.log(products[0]);
      
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  let userCart;
  let newQuantity = 1;
  req.user.getCart()
    .then(cart => {
      userCart = cart;
      return cart.getProducts({ where: {id: prodId } });
    })
    .then(products => {
      let product;
      if(products.length > 0){
        product = products[0];
        newQuantity = product.cart_item.quantity + 1
        return product;
      }
      return Product.findByPk(prodId);
    })
    .then(product => {
      return userCart.addProduct(product, { through: {quantity: newQuantity} });
    })
    .then(() => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user.getCart()
  .then(cart => {
    return cart.getProducts({ where: { id: prodId } });
  })
  .then(([product]) => {
    return product.cart_item.destroy();
  })
  .then(() => {
    res.redirect('/cart');
  })
  .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  let userCart;
  req.user.getCart()  
  .then(cart => {
    userCart = cart;
    return cart.getProducts();
  })
  .then(products => {
    return req.user.createOrder()
      .then(order => {
        return order.addProducts(products.map( product => {
          product.order_item = { quantity: product.cart_item.quantity };
          return product;
        }))
      })
      .catch(err => console.log(err));
  })
  .then(() => {
    userCart.setProducts(null);
  })
  .then(() => {
    res.redirect('/orders');
  })
  .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  req.user.getOrders({ include: ['products'] })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));
  
};

exports.getCheckout = (req, res, next) => {
  res.render('shop/checkout', {
    path: '/checkout',
    pageTitle: 'Checkout'
  });
};
