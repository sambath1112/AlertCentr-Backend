(function ()
{
    'use strict';
    var applicationException = require('../services/applicationException'),
            business = require('../business/business.container');

    module.exports = function (router)
    {
        router.route('/api/device/:groupId').get(function (request, respond)
        {
            var query = {
                query: request.query.query || '',
                alertId: request.query.alertId || null,
                productId: request.query.productId || null,
                vendorId: request.query.vendorId || null,
                issues: request.query.issues || null
            };
            business.getDeviceManager(request).search(query, request.params.groupId).then(function (result)
            {
                respond.status(200).send(result);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            })
        });

        router.route('/api/device').post(function (request, respond)
        {
            business.getDeviceManager(request).createOrUpdate(request.body).then(function (results)
            {
                respond.status(200).send(results);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            });
        });

        router.route('/api/device/:id').delete(function (request, respond)
        {
            business.getDeviceManager(request).remove(request.params.id).then(function ()
            {
                respond.sendStatus(200);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            });
        });
    }
})();
