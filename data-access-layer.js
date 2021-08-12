const RestaurantDetail = require('./models/restaurant-details');
const RestaurantMenu = require('./models/menu-details');

async function getRestaurantById(id) {
    const rest = await RestaurantDetail.findById(id);
    return rest;
}

async function getRestaurant(filter) {
    const rest = await RestaurantDetail.find(filter).exec();
    return rest;
}

async function getRestaurantMenuByRestaurantId(id) {
    const menuD = await RestaurantMenu.find({restaurant_id: id}).sort({cuisine: 1});
    return menuD;
}

module.exports = {
    getRestaurantById,
    getRestaurant,
    getRestaurantMenuByRestaurantId
}