let worker = {};

let Events = require('events');

class EventManager extends Events {};
const EVENTS = new EventManager();
let ADDED_CHANNELS = [];

worker.on = function () {};

module.exports = worker;
