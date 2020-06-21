const mongodb = require('mongodb');
const { getDb } = require('../util/database');

const { ObjectId } = mongodb;
class User {
  constructor(name, email, cart, id) {
    this.name = name;
    this.email = email;
    this.cart = cart;
    this._id = id ? new mongodb.ObjectId(id) : undefined;
  }

  save() {
    const db = getDb();
    const dbOp = db.collection('users').insertOne(this);
    return dbOp
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static fetchAll() {
  }

  static findById(userId) {
    const db = getDb();
    return db.collection('users')
      .findOne({ _id: new ObjectId(userId) })
      .then((product) => product)
      .catch((err) => {
        console.log(err);
      });
  }

  addToCart(product) {
    const db = getDb();
    const cartProductIndex = this.cart.items.findIndex((cp) => cp.productId.toString() === product._id.toString());
    const updatedCartItems = [...this.cart.items];
    if (cartProductIndex < 0) {
      updatedCartItems.push({ productId: product._id, quantity: 1 });
    } else {
      const newQuantity = this.cart.items[cartProductIndex].quantity + 1;
      updatedCartItems[cartProductIndex].quantity = newQuantity;
    }
    const updatedCart = { items: updatedCartItems };
    return db.collection('users').updateOne({ _id: this._id }, { $set: { cart: updatedCart } });
  }

  getCart() {
    const db = getDb();
    const productIds = this.cart.items.map((i) => i.productId);
    return db.collection('products').find({ _id: { $in: productIds } })
      .toArray()
      .then((products) => products.map((p) => ({
        ...p,
        quantity: this.cart.items.find((i) => i.productId.toString() === p._id.toString()).quantity,
      })));
  }

  deleteItemFromCart(productId) {
    const db = getDb();
    const updatedCartItems = this.cart.items.filter((item) => item.productId.toString() !== productId.toString());
    return db.collection('users').updateOne({ _id: this._id }, { $set: { cart: { items: updatedCartItems } } });
  }

  addOrder() {
    const db = getDb();
    return this.getCart()
      .then((products) => {
        const order = {
          items: products,
          user: {
            _id: this._id,
            name: this.name,
          },
        };
        return db.collection('orders').insertOne(order);
      })
      .then(() => {
        this.cart = { items: [] };
        return db.collection('users').updateOne({ _id: this._id }, { $set: { cart: this.cart } });
      });
  }

  getOrders() {
    const db = getDb();
    return db.collection('orders').find({ 'user._id': this._id })
      .toArray();
  }
}

module.exports = User;
