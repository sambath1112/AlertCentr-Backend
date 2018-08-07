(function ()
{

    var userManager = require('../business/user.manager'),
            applicationException = require('../services/applicationException'),
            business = require('../business/business.container');

    module.exports = function (router)
    {
        router.route('/api/user/me').get(function (request, response)
        {
            //must use status().send().end() because when I use sendStatus() throw error "can't set headers after they are sent. node js express js"
            /*jshint -W030*/
            request.user ? response.status(200).send(request.user).end() : response.status(401).send({message: 'User does not exist or token expired'}).end();
        });

        router.route('/api/user/me/optional').get(function (request, response)
        {
            /*jshint -W030*/
            request.user ? response.status(200).send(request.user).end() : response.status(200).send({}).end();
        });

        router.route('/api/user/active/:token').get(function (request, respond)
        {
            userManager.activeAccount(request.params.token).then(function ()
            {
                respond.sendStatus(200);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            })
        });

        router.route('/api/user/check').post(function (request, response)
        {
            userManager.isLocalAccountExists(request.body.emailOrNickName).then(function (result)
            {
                response.status(200).send(result);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, response)
            });
        });

        router.route('/api/user').put(function (request, respond)
        {
            business.getUserManager(request).saveSettings(request.body).then(function (results)
            {
                respond.status(200).send(results);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            });
        });

        router.route('/api/user/register').post(function (request, respond)
        {
            userManager.register(request.body).then(function (result)
            {
                respond.status(200).send(result);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond)
            })
        });

        router.route('/api/user/reset').post(function (request, respond)
        {
            userManager.resetPassword(request.body.email).then(function ()
            {
                respond.sendStatus(200);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            })
        });

        router.route('/api/user/setpassword').post(function (request, respond)
        {
            userManager.setPassword(request.body.token, request.body.password).then(function ()
            {
                respond.sendStatus(200);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            })
        });

        router.route('/api/user/token/:token').get(function (request, respond)
        {
            userManager.checkToken(request.params.token).then(function ()
            {
                respond.sendStatus(200);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, respond);
            })
        });

        router.route('/api/user/auth').post(function (request, response)
        {
            userManager.authenticate(request.body.email, request.body.password).then(function (result)
            {
                response.status(200).send(result);
            }).catch(function (error)
            {
                applicationException.errorHandler(error, response)
            });
        });

    }

})();
