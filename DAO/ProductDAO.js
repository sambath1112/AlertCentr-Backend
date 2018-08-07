(function ()
{
    'use strict';
    var mongoConverter = require('./mongoConverter'),
            applicationException = require('../services/applicationException'),
            mongoose = require('mongoose-q')(),
            product = new mongoose.Schema({
                name: {required: true, type: String},
                keywordsSubject: {type: Array},
                exemptSubject: {type: Array},
                keywordsBody: {type: Array},
                exemptBody: {type: Array},
                vendorId: {required: true, type: String}
            }, {
                collection: 'product'
            });
    var Model = mongoose.model('product', product);

    function search(vendorId)
    {
        if (!vendorId) {
            return Model.findQ({$query: {}, $orderby: {_id: 1, name: 1}}, {name: 1, _id: 1, vendorId: 1}).then(function (results)
            {
                return {results: mongoConverter.fromMongo(results)};
            });
        } else {
            return Model.find({$query: {vendorId: vendorId}, $orderby: {_id: 1, name: 1}}, {name: 1, _id: 1, vendorId: 1}).then(function (results)
            {
                return {results: mongoConverter.fromMongo(results)};
            });
        }
    }

    function createOrUpdate(produt)
    {
        if (!produt.id) {
            return new Model(produt).saveQ().then(function (results)
            {
                return {results: mongoConverter.fromMongo(results)};
            });
        } else {
            return Model.findByIdAndUpdateQ(produt.id, produt, {new: true}).then(function (results)
            {
                return {results: mongoConverter.fromMongo(results)};
            });
        }
    }

    function getEntity(productId)
    {
        return Model.findById(productId).then(function (results)
        {
            if (!results) {
                throw applicationException.new(applicationException.NOT_FOUND)
            }
            return {results: mongoConverter.fromMongo(results)};
        });
    }

    function addWord(productId, word)
    {
        for (var key in word) {
            if (word.hasOwnProperty(key)) {
                var query = {$addToSet: {}};
                query.$addToSet[key] = word[key];
                return Model.findByIdAndUpdate(productId, query);
            }
        }
    }

    function remove(productId)
    {
        var DeviceModel = require('./DeviceDAO').model;
        return Model.findByIdAndRemoveQ(productId).then(function ()
        {
            return DeviceModel.remove({productId: productId});
        });
    }

    module.exports = {
        remove: remove,
        addWord: addWord,
        search: search,
        getEntity: getEntity,
        createOrUpdate: createOrUpdate,
        model: Model,
        schema:product
    }
})();
