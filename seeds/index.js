const mongoose = require('mongoose');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const Campground = require('../models/campground');

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open", () => {
    console.log("Database Connected");
});

const sample = array => array[Math.floor(Math.random() * array.length)];
    
const seedDB = async () => {
    await Campground.deleteMany({})
    for (let i = 0; i < 800; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random() * 20)+10;
        const camp = new Campground({
            author: '65b27ece01afd779c18585b3',
            location: `${cities[random1000].city},${cities[random1000].state}`,
            title: `${sample(descriptors)} ${sample(places)}`,
            description: 'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Consequatur, voluptatum. Laudantium optio aspernatur quod vero corporis maiores culpa in dolores, eius ex dolor maxime sint ad tempore reiciendis quam et.',
            price,
            geometry:{
                type: 'Point',
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude
                ]
            },
            images:[
                {
                  url: 'https://res.cloudinary.com/dh7wdmycq/image/upload/v1706827134/YelpCamp/kdsqpanu0ery7yyasnoa.jpg',
                  filename: 'YelpCamp/kdsqpanu0ery7yyasnoa'
                },
                {
                  url: 'https://res.cloudinary.com/dh7wdmycq/image/upload/v1706827135/YelpCamp/xbsn9od3vcdcoodffqsc.jpg',
                  filename: 'YelpCamp/xbsn9od3vcdcoodffqsc'
                }
              ]
        });
        await camp.save();
    }
}
seedDB().then(() => {
    mongoose.connection.close();
});