const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBSesion = require('connect-mongodb-session')(session);

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI = 'mongodb+srv://omnistack:omnistack@development-h5m1r.mongodb.net/nodestore?retryWrites=true&w=majority';

const app = express();
const sessionStore = new MongoDBSesion({
  uri: MONGODB_URI,
  collection: 'session',
});

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'my-node-store', resave: false, saveUninitialized: false, store: sessionStore,
}));

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorController.get404);

mongoose.connect(MONGODB_URI)
  .then(() => User.findOne())
  .then((user) => {
    if (!user) {
      const newUser = new User({
        name: 'Vinicius',
        email: 'vinicius@mail.com',
        cart: { items: [] },
      });
      return newUser.save();
    }
    return Promise.resolve(user);
  })
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => {
    console.log(err);
  });
