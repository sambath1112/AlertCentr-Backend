(function ()
{
    'use strict';
    var mongoConverter = require('./mongoConverter');
    var mongoose = require('mongoose-q')();
    var alert = new mongoose.Schema({
        name: String
    }, {
        collection: 'alert'
    });
    var Model = mongoose.model('alert', alert);

    function search()
    {
        return Model.findQ(null, null, {sort: 'name'}).then(function (result)
        {
            return {results: mongoConverter.fromMongo(result)};
        });
    }

    function createOrUpdate(alert)
    {
        if (!alert.id) {
            return Model(alert).saveQ();
        } else {
            return Model.findByIdAndUpdateQ(alert.id, alert)
        }
    }

    module.exports = {
        createOrUpdate: createOrUpdate,
        search: search,
        model: Model,
        schema: alert
    }
})();
