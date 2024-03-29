if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}


const express = require("express");
const path = require("path");
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground');
const campground = require("./models/campground");
const ejsMate = require('ejs-mate');
const Joi = require('joi');
const { campgroundSchema, reviewSchema } = require('./schemas.js');
const Review = require('./models/review.js')
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js')
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');

const userRoutes = require('./routes/users.js')
const campgroundRoutes = require('./routes/campgrounds.js');
const reviewRoutes = require('./routes/reviews.js');
const MongoDBStore = require('connect-mongo')(session);

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
// process.env.DB_URL
// 'mongodb://localhost:27017/yelp-camp'

mongoose.connect( dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", () => {
    console.log("Database Connected");
});

const app = express();

app.engine('ejs', ejsMate);
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanitize());

const store = new MongoDBStore({
    url: dbUrl,
    secret: 'thisshouldbeabettersecret',
    touchAfter: 24 * 60 * 60
});

store.on("error", function(e){
    console.log("SESSION STORE ERROR",e)
})

const sessionConfig = {
    store,
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet({ contentSecurityPolicy: false }));

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [

    "https://stackpath.bootstrapcdn.com/",
    "https://kit-free.fontawesome.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dh7wdmycq/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
    // console.log(req.query)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.get('/fakeUser', async (req, res) => {
    const user = new User({ email: 'smsaurabhmishra61@gmail.com', username: 'bean' })
    const newUser = await User.register(user, 'chicken');
    res.send(newUser);
})

app.use('/', userRoutes);
app.use('/campground', campgroundRoutes);
app.use('/campground/:id/reviews', reviewRoutes);
app.get('/', (req, res) => {
    res.render('home');
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh no! Something went Wrong';
    res.status(statusCode).render('error', { err });
})
 const port = process.env.PORT
app.listen(port, () => {
    console.log(`LISTENING ON PORT ${port}`);
})
