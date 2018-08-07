(function ()
{
    'use strict';

    var applicationException = require('../services/applicationException'),
            business = require('../business/business.container');

    module.exports = function (router)
    {
        router.route('/api/email').get(function (request, respond)
        {

            business.getEmailManager(request).getEmail().then(function (results)
            {
                respond.status(200).send(results);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            })
        });
        router.route('/api/email/contact').post(function (request, respond)
        {
            business.getEmailManager(request).sendContact(request.body).then(function ()
            {
                respond.sendStatus(200);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            })
        });

        router.route('/api/email').post(function (request, respond)
        {
            business.getEmailManager(request).sendEmail(request.body).then(function ()
            {
                respond.sendStatus(200)
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            })
        });

        router.route('/api/email/:deviceId').get(function (request, respond)
        {
            var query = {
                from: request.query.from || 0,
                size: request.query.size || 10
            };
            business.getEmailManager(request).search(request.params.deviceId, query).then(function (results)
            {
                respond.status(200).send(results);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            })
        })
    }
})();
