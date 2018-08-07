(function ()
{
    'use strict';
    var applicationException = require('../services/applicationException'),
            business = require('../business/business.container');

    module.exports = function (router)
    {
        router.route('/api/alert').get(function (request, respond)
        {
            business.getAlertManager(request).search().then(function (results)
            {
                respond.status(200).send(results);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            });
        })
    }
})();
