const mongodb = require('mongodb');
const { getDb } = require('../util/database');

class Product {
  constructor(title, price, description, imageUrl, id, userId) {
    this.title = title;
    this.price = price;
    this.description = description;
    this.imageUrl = imageUrl;
    this._id = id ? new mongodb.ObjectId(id) : undefined;
    this.userId = userId;
  }

  save() {
    const db = getDb();
    let dbOp;
    if (this._id) {
      dbOp = db.collection('products').updateOne({ _id: new mongodb.ObjectId(this._id) }, { $set: this });
    } else {
      dbOp = db.collection('products').insertOne(this);
    }
    return dbOp
      .then((result) => {
        console.log(result);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  static fetchAll() {
    const db = getDb();
    return db.collection('products')
      .find()
      .toArray()
      .then((products) => products)
      .catch((err) => {
        console.log(err);
      });
  }

  static findById(proId) {
    const db = getDb();
    return db.collection('products')
      .find({ _id: new mongodb.ObjectId(proId) })
      .next()
      .then((product) => product)
      .catch((err) => {
        console.log(err);
      });
  }

  static DeleteById(proId) {
    const db = getDb();
    return db.collection('products')
      .deleteOne({ _id: new mongodb.ObjectId(proId) })
      .then(() => {})
      .catch((err) => {
        console.log(err);
      });
  }
}

module.exports = Product;
