const authRoutes = require('./auth');
const emailRoutes = require('./email');
const recommendationRoutes = require('./recommendation');
const coffeeAnalysisRoutes = require('./coffeeAnalysis');
const collectionsRoutes = require('./collections');
const phoneRoutes = require('./phone');
const signupRoutes = require('./signup');
const reviewRoutes = require('./review');
const orderRoutes = require('./order');
const analyticsRoutes = require('./analytics');
const labelsRoutes = require('./labels');
const systemRoutes = require('./system');

const routes = [
  {
    path: '/auth',
    routes: authRoutes,
  },
  {
    path: '/email',
    routes: emailRoutes,
  },
  {
    path: '/recommendation',
    routes: recommendationRoutes,
  },
  {
    path: '/analysis',
    routes: coffeeAnalysisRoutes,
  },
  {
    path: '/collections',
    routes: collectionsRoutes,
  },
  {
    path: '/phone',
    routes: phoneRoutes,
  },
  {
    path: '/signup',
    routes: signupRoutes,
  },
  {
    path: '/reviews',
    routes: reviewRoutes,
  },
  {
    path: '/orders',
    routes: orderRoutes,
  },
  {
    path: '/analytics',
    routes: analyticsRoutes,
  },
  {
    path: '/labels',
    routes: labelsRoutes,
  },
  {
    path: '/system',
    routes: systemRoutes,
  },
];

module.exports = {
  routes,
};



//  i just want map all routes and i want to execute that in index.js file