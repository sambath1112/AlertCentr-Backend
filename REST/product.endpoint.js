(function ()
{
    'use strict';
    var applicationException = require('../services/applicationException'),
            business = require('../business/business.container');

    module.exports = function (router)
    {
        router.route('/api/products').get(function (request, respond)
        {
            business.getProductManager(request).search().then(function (results)
            {
                respond.status(200).send(results);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            });
        });

        router.route('/api/products/:vendorId').get(function (request, respond)
        {
            business.getProductManager(request).search(request.params.vendorId).then(function (results)
            {
                respond.status(200).send(results);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            });
        });

        router.route('/api/product').post(function (request, respond)
        {
            business.getProductManager(request).createOrUpdate(request.body).then(function (results)
            {
                respond.status(200).send(results);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            });
        });

        router.route('/api/product/:productId').get(function (request, respond)
        {
            business.getProductManager(request).getEntity(request.params.productId).then(function (results)
            {
                respond.status(200).send(results);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            })
        });

        router.route('/api/product/:productId').patch(function (request, respond)
        {
            business.getProductManager(request).addWord(request.params.productId, request.body).then(function ()
            {
                respond.sendStatus(200);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            });
        });

        router.route('/api/product/:id').delete(function (request, respond)
        {
            business.getProductManager(request).remove(request.params.id).then(function ()
            {
                respond.sendStatus(200);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            });
        })
    }
})();
