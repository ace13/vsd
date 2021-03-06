const Glue = require('glue')
const requireDirectory = require('require-directory')
const config = require('./config')
const manifest = require('./server/manifest')
const pkg = require('./package.json')
const appName = pkg.name
const appVersion = pkg.version

Glue.compose(manifest, function (err, server) {
  if (err) {
    throw err
  }

  const defaultMetaData = {
    title: 'VisualDEV',
    description: 'Web application builder for hapi and mongo',
    keywords: 'hapijs,mongoose,nodejs,ide,web,javascript,standardjs',
    author: 'vsd'
  }

  const onPostHandler = function (request, reply) {
    const response = request.response
    if (response.variety === 'view') {
      if (!response.source.context) {
        response.source.context = {}
      }

      // Apply the default page meta data
      // to the view context meta data
      var context = response.source.context
      context.meta = context.meta || {}

      for (var key in defaultMetaData) {
        if (!context.meta[key]) {
          context.meta[key] = defaultMetaData[key]
        }
      }

      /*
       * Apply auth to the
       * view context data
       */
      var auth = request.auth
      var isAuthenticated = auth.isAuthenticated

      context.isAuthenticated = isAuthenticated
      if (isAuthenticated) {
        var credentials = auth.credentials
        context.auth = credentials
        context.authJSON = JSON.stringify(credentials)
      }
    }
    return reply.continue()
  }

  const preResponse = function (request, reply) {
    var response = request.response

    if (response.isBoom) {
      // An error was raised during
      // processing the request
      var statusCode = response.output.statusCode

      // In the event of 404
      // return the `404` view
      if (statusCode === 404) {
        return reply.view('404').code(statusCode)
      }

      request.log('error', {
        statusCode: statusCode,
        data: response.data,
        message: response.message
      })

      // The return the `500` view
      return reply.view('500').code(statusCode)
    }
    return reply.continue()
  }

  server.ext('onPostHandler', onPostHandler)

  server.ext('onPreResponse', preResponse)

  // Load all routes
  const routes = requireDirectory(module, './server/routes')
  for (var key in routes) {
    server.route(routes[key])
  }

  // Configure views
  server.views(require('./server/views'))

  /*
   * Start the server
   */
  server.start(function (err) {
    var details = {
      name: appName,
      version: appVersion,
      info: server.info
    }

    if (err) {
      details.error = err
      details.message = 'Failed to start ' + details.name
      server.log(['error', 'info'], details)
      throw err
    } else {
      details.config = config
      details.message = 'Started ' + details.name
      server.log('info', details)
      console.info('Server running at:', server.info)
    }
  })
})
